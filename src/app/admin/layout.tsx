"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Package,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Commandes", icon: Package },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/pricing", label: "Produits & Tarifs", icon: Tag },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

/* ──────────────────────────────────────────────────────────── */
/*  Sidebar content (shared between desktop + mobile)          */
/* ──────────────────────────────────────────────────────────── */
function SidebarContent({
  pathname,
  adminName,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  adminName: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <nav className="p-3 space-y-0.5 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                active
                  ? "text-foreground font-semibold bg-foreground/[0.06]"
                  : "text-muted hover:text-foreground hover:bg-foreground/[0.03]"
              }`}
            >
              <item.icon size={16} strokeWidth={active ? 2.2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
            <Shield size={12} className="text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{adminName}</p>
            <p className="text-[10px] text-muted">Administrateur</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={onNavigate}
            className="text-[11px] text-muted hover:text-foreground transition-colors"
          >
            ← Retour au site
          </Link>
          <span className="text-border">|</span>
          <button
            onClick={() => { onLogout(); onNavigate?.(); }}
            className="text-[11px] text-muted hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <LogOut size={10} /> Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Admin Layout with Auth Gate                                */
/* ──────────────────────────────────────────────────────────── */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authState, setAuthState] = useState<
    "loading" | "ok" | "no-admin" | "unauthorized"
  >("loading");
  const [adminName, setAdminName] = useState("");

  // Skip auth gate for setup page
  const isSetupPage = pathname === "/admin/setup";

  const checkAuth = useCallback(async () => {
    if (isSetupPage) {
      setAuthState("ok");
      return;
    }

    // Reset to loading before async checks to prevent stale "ok" state
    setAuthState("loading");

    try {
      // 1. Check if any admin exists
      const setupRes = await fetch("/api/admin/setup");
      const setupData = await setupRes.json();
      if (!setupData.hasAdmin) {
        setAuthState("no-admin");
        return;
      }

      // 2. Check if current user is admin
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) {
        setAuthState("unauthorized");
        return;
      }
      const meData = await meRes.json();
      if (!meData.customer || meData.customer.role !== "admin") {
        setAuthState("unauthorized");
        return;
      }

      setAdminName(meData.customer.name);
      setAuthState("ok");
    } catch {
      setAuthState("unauthorized");
    }
  }, [isSetupPage]);

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth, pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };

  // Loading state
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 size={24} className="animate-spin text-muted" />
          <p className="text-sm text-muted">Vérification des accès…</p>
        </motion.div>
      </div>
    );
  }

  // No admin exists → redirect to setup
  if (authState === "no-admin") {
    router.replace("/admin/setup");
    return null;
  }

  // Not admin → show unauthorized
  if (authState === "unauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Shield size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
          <p className="text-sm text-muted mb-6">
            Vous devez être connecté en tant qu&apos;administrateur pour accéder à cette page.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/compte/connexion" className="btn-primary text-sm">
              Se connecter
            </Link>
            <Link href="/" className="btn-secondary text-sm">
              Retour au site
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Setup page → render children directly (its own layout is handled)
  if (isSetupPage) {
    return <>{children}</>;
  }

  // ─── Authenticated admin layout ────────────────────────────
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] border-r border-border/60 flex-shrink-0 flex-col bg-white/60">
        <div className="px-5 py-4 border-b border-border/60">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">
              DTF Admin
            </span>
          </Link>
        </div>
        <SidebarContent
          pathname={pathname}
          adminName={adminName}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-13 border-b border-border/60 bg-white/90 backdrop-blur-md flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <Shield size={10} className="text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">DTF Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-foreground/5 transition-all"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-white border-r border-border flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
                    <Shield size={10} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    DTF Admin
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent
                pathname={pathname}
                adminName={adminName}
                onNavigate={() => setMobileOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
