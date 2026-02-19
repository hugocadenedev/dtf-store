"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Mail,
  Calendar,
  ShoppingCart,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Shield,
  User,
  Package,
} from "lucide-react";

interface ClientOrder {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: Array<{ id: string; sizeLabel: string; quantity: number; totalPrice: number }>;
}

interface Client {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number;
  orders: ClientOrder[];
}

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

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  received: { label: "Reçue", cls: "bg-blue-50 text-blue-600" },
  preparing: { label: "En préparation", cls: "bg-amber-50 text-amber-600" },
  shipped: { label: "Expédiée", cls: "bg-emerald-50 text-emerald-600" },
};

const PAYMENT_LABELS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Payé", cls: "bg-emerald-50 text-emerald-600" },
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-600" },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-600" },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Client row with expandable orders                             */
/* ═══════════════════════════════════════════════════════════════ */
function ClientRow({ client, index }: { client: Client; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-foreground/[0.02] transition-colors border-b border-border/30 last:border-0"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
            {client.role === "admin" ? (
              <Shield size={16} className="text-amber-500" />
            ) : (
              <User size={16} className="text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold truncate">{client.name}</p>
              {client.role === "admin" && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted truncate">{client.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold">{formatCurrency(client.totalSpent)}</p>
            <p className="text-[10px] text-muted">
              {client.paidOrderCount} commande{client.paidOrderCount > 1 ? "s" : ""} payée{client.paidOrderCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs text-muted">{formatDateShort(client.createdAt)}</p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
            {expanded ? (
              <ChevronUp size={14} className="text-muted" />
            ) : (
              <ChevronDown size={14} className="text-muted" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded orders */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              {client.orders.length === 0 ? (
                <p className="text-xs text-muted py-3 pl-14">
                  Aucune commande passée.
                </p>
              ) : (
                <div className="ml-14 space-y-2">
                  {client.orders.map((order) => {
                    const payment = PAYMENT_LABELS[order.paymentStatus] ?? PAYMENT_LABELS.pending;
                    const status = STATUS_LABELS[order.orderStatus] ?? STATUS_LABELS.received;
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.02] border border-border/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Package size={13} className="text-muted shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold">
                              {formatDateShort(order.createdAt)}
                              <span className="text-muted font-normal mx-1.5">·</span>
                              {order.items.length} article{order.items.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-[10px] text-muted font-mono mt-0.5 truncate">
                              {order.id.slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.cls}`}>
                            {status.label}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${payment.cls}`}>
                            {payment.label}
                          </span>
                          <span className="text-xs font-bold w-16 text-right">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Clients page                                                  */
/* ═══════════════════════════════════════════════════════════════ */
export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "revenue" | "orders">("recent");

  useEffect(() => {
    fetch("/api/admin/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setClients(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter + sort
  const filtered = clients
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "revenue") return b.totalSpent - a.totalSpent;
      if (sortBy === "orders") return b.orderCount - a.orderCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Stats
  const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = clients.reduce((s, c) => s + c.paidOrderCount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 shimmer" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 shimmer rounded-2xl" />
          <div className="h-20 shimmer rounded-2xl" />
          <div className="h-20 shimmer rounded-2xl" />
        </div>
        <div className="h-64 shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-sm text-muted mt-1">
          {clients.length} compte{clients.length > 1 ? "s" : ""} enregistré{clients.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted font-semibold">Clients</p>
              <p className="text-lg font-bold">{clients.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted font-semibold">CA total</p>
              <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShoppingCart size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted font-semibold">Commandes payées</p>
              <p className="text-lg font-bold">{totalOrders}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm w-auto sm:w-48"
        >
          <option value="recent">Plus récents</option>
          <option value="revenue">Meilleur CA</option>
          <option value="orders">Plus de commandes</option>
        </select>
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={24} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">
            {search ? "Aucun résultat." : "Aucun client inscrit."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3 border-b border-border/50 bg-foreground/[0.02] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted">
            <span className="flex-1">Client</span>
            <div className="flex items-center gap-5 shrink-0">
              <span className="hidden sm:block w-24 text-right">Dépensé</span>
              <span className="hidden md:block w-24 text-right">Inscription</span>
              <span className="w-7" />
            </div>
          </div>

          {filtered.map((client, i) => (
            <ClientRow key={client.id} client={client} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
