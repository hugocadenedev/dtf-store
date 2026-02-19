"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tag, Package, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pricing", label: "Tarifs", icon: Tag },
  { href: "/admin/orders", label: "Commandes", icon: Package },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="p-3 space-y-1 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                active
                  ? "text-foreground font-semibold bg-foreground/5"
                  : "text-muted hover:text-foreground hover:bg-foreground/[0.03]"
              }`}
            >
              <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ← Retour au site
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-border flex-shrink-0 flex-col bg-white/50">
        <div className="p-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Admin</span>
          </Link>
        </div>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 border-b border-border bg-white/90 backdrop-blur-md flex items-center justify-between px-4">
        <Link href="/admin" className="text-sm font-bold text-foreground">
          Admin
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-muted hover:text-foreground transition-colors"
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
              className="md:hidden fixed inset-0 z-40 bg-black/20"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-border flex flex-col shadow-xl"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <Link href="/admin" className="text-sm font-bold text-foreground">
                  Admin
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-muted hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
