"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Download,
  ChevronDown,
  X,
  Package,
  User,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  Ruler,
  Eye,
  Truck,
  Phone,
  Building2,
  MapPin,
  Search,
  RefreshCw,
} from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: "received", label: "Reçue", color: "bg-blue-50 text-blue-600" },
  { value: "producing", label: "En production", color: "bg-amber-50 text-amber-600" },
  { value: "delivered", label: "Livrée", color: "bg-emerald-50 text-emerald-600" },
];

const PAYMENT_LABELS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Payé", cls: "bg-emerald-50 text-emerald-600" },
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-600" },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-600" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusOption(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Order Detail Modal                                            */
/* ═══════════════════════════════════════════════════════════════ */
function OrderDetail({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  const payment = PAYMENT_LABELS[order.paymentStatus] ?? PAYMENT_LABELS.pending;
  const statusOpt = getStatusOption(order.orderStatus);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
                <Package size={14} className="text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Commande</h2>
            </div>
            <p className="text-[10px] text-muted font-mono mt-0.5">{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-foreground/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Info grid */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Client</p>
                <p className="text-sm font-semibold mt-0.5">{order.customerFirstName || ""} {order.customerLastName || order.customerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <Mail size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Email</p>
                <p className="text-sm font-semibold mt-0.5 break-all">{order.customerEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <Phone size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Téléphone</p>
                <p className="text-sm font-semibold mt-0.5">{order.customerPhone || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Entreprise</p>
                <p className="text-sm font-semibold mt-0.5">{order.customerCompany || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Adresse de livraison</p>
                <p className="text-sm font-semibold mt-0.5">
                  {order.customerAddress ? `${order.customerAddress}, ${order.customerPostalCode} ${order.customerCity}` : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Date</p>
                <p className="text-sm font-semibold mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Paiement</p>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${payment.cls}`}>
                  {payment.label}
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Ruler size={12} className="text-muted shrink-0" />
                        <span className="text-sm font-bold">{item.sizeLabel}</span>
                        <span className="text-xs text-muted">× {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>
                          Prix unitaire : <strong className="text-foreground">{formatCurrency(item.unitPrice)}</strong>
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
                    {item.filePath && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <a
                          href={`/api${item.filePath}`}
                          download
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Download size={12} /> PDF 300 DPI
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-foreground/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <Truck size={14} className="text-muted" />
            <div className="relative">
              <select
                value={order.orderStatus}
                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                className="text-xs font-semibold pr-8 py-1.5 w-auto rounded-lg"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Total HT</p>
            <p className="text-xl font-bold">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main page                                                     */
/* ═══════════════════════════════════════════════════════════════ */
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetch("/api/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderStatus: newStatus }),
    });

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, orderStatus: newStatus } : o
      )
    );
  };

  const filtered = orders
    .filter((o) => {
      if (filter !== "all" && o.orderStatus !== filter) return false;
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.customerPhone || "").includes(q) ||
          (o.customerCompany || "").toLowerCase().includes(q)
        );
      }
      return true;
    });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  // Quick stats
  const paidCount = orders.filter((o) => o.paymentStatus === "paid").length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 shimmer" />
      <div className="h-12 shimmer rounded-xl" />
      <div className="h-20 shimmer rounded-xl" />
      <div className="h-20 shimmer rounded-xl" />
      <div className="h-20 shimmer rounded-xl" />
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-sm text-muted mt-1">
            {orders.length} commande{orders.length > 1 ? "s" : ""}
            <span className="mx-1.5">·</span>
            {paidCount} payée{paidCount > 1 ? "s" : ""}
            <span className="mx-1.5">·</span>
            {formatCurrency(totalRevenue)} CA
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="btn-secondary text-xs self-start"
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher nom, email, société, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm w-auto rounded-lg"
        >
          <option value="all">Statut: Toutes ({orders.length})</option>
          <option value="received">Reçues ({orders.filter((o) => o.orderStatus === "received").length})</option>
          <option value="producing">En production ({orders.filter((o) => o.orderStatus === "producing").length})</option>
          <option value="delivered">Livrées ({orders.filter((o) => o.orderStatus === "delivered").length})</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="text-sm w-auto rounded-lg"
        >
          <option value="all">Paiement: Tous</option>
          <option value="paid">Payé ({orders.filter((o) => o.paymentStatus === "paid").length})</option>
          <option value="pending">En attente ({orders.filter((o) => o.paymentStatus === "pending").length})</option>
          <option value="failed">Échoué ({orders.filter((o) => o.paymentStatus === "failed").length})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">Aucune commande.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const statusOpt = getStatusOption(order.orderStatus);
            const payment = PAYMENT_LABELS[order.paymentStatus] ?? PAYMENT_LABELS.pending;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedOrderId(order.id)}
                className="card px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-foreground/15 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-foreground/10 transition-colors">
                    <Package size={16} className="text-muted" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-bold truncate">{order.customerName}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${statusOpt.color}`}>
                        {statusOpt.label}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${payment.cls}`}>
                        {payment.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {formatDate(order.createdAt)}
                      <span className="mx-1.5">·</span>
                      {order.items.length} article{order.items.length > 1 ? "s" : ""}
                      <span className="mx-1.5">·</span>
                      {order.items.map((it) => it.sizeLabel).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-bold">{formatCurrency(order.totalAmount)}</span>
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 flex items-center justify-center transition-colors">
                    <Eye size={14} className="text-muted" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetail
            key={selectedOrder.id}
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
            onUpdateStatus={(id, status) => {
              updateStatus(id, status);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
