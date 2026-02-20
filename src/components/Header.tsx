"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, UserCircle, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/pricing";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const router = useRouter();
  const { items, removeItem, totalPrice } = useCart();
  const { customer } = useAuth();
  const count = items.length;
  const [pastGradient, setPastGradient] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => {
      const gradient = document.querySelector(".hero-gradient");
      if (gradient) {
        const rect = gradient.getBoundingClientRect();
        // Switch to glass once the bottom of the gradient zone scrolls above ~80px
        setPastGradient(rect.bottom < 80);
      } else {
        // No gradient zone on this page → always glass after small scroll
        setPastGradient(window.scrollY > 10);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [pathname]);

  // White (transparent) while inside gradient, glass once past it
  const showWhite = !pastGradient;

  // Close cart dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    };
    if (cartOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cartOpen]);

  // Close cart & mobile menu on route change
  useEffect(() => {
    setCartOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-5 sm:top-6 md:top-8 z-50 transition-all duration-300 mx-2 sm:mx-3 md:mx-4 rounded-2xl ${
        pastGradient
          ? "glass border border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto px-5 sm:px-8 md:px-10 h-14 sm:h-16 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/Impresive..svg"
            alt="Impressive"
            className={`h-7 sm:h-8 w-auto transition-all duration-300 ${
              showWhite ? "" : "invert"
            }`}
          />
        </Link>

        {/* Desktop nav — centered links */}
        <nav className="hidden sm:flex items-center gap-2 md:gap-3 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/configure/metre"
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
              showWhite
                ? "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            Planches DTF au mètre
          </Link>
        </nav>

        {/* Right — Account + Cart */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href={customer ? "/compte" : "/compte/connexion"}
            className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
              showWhite
                ? "text-white/80 hover:text-white hover:bg-white/10"
                : "text-muted hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <UserCircle size={16} />
            {customer ? customer.name.split(" ")[0] : "Connexion"}
          </Link>

          {/* Cart button + dropdown */}
          <div className="relative" ref={cartRef}>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className={`relative inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                showWhite
                  ? "bg-white text-foreground hover:bg-white/90"
                  : "bg-foreground text-white hover:bg-accent-hover"
              }`}
            >
              <ShoppingCart size={15} />
              Panier
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      showWhite
                        ? "bg-foreground text-white"
                        : "bg-white text-foreground"
                    }`}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Cart dropdown */}
            <AnimatePresence>
              {cartOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50"
                  style={{
                    background: "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                  }}
                >
                  {count === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                      <p className="text-sm font-semibold text-foreground">Panier vide</p>
                      <p className="text-xs text-muted mt-1">Configurez un produit DTF pour commencer.</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100/80">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Mon panier ({count})
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <AnimatePresence>
                          {items.map((item, i) => (
                            <motion.div
                              key={i}
                              layout
                              exit={{ opacity: 0, x: -30, height: 0 }}
                              className="px-4 py-3 flex items-start gap-3 border-b border-gray-100/60 last:border-0"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{item.productName}</p>
                                <p className="text-[11px] text-muted mt-0.5 truncate">
                                  {item.sizeLabel} × {item.quantity}{" "}
                                  {item.productType === "metre" ? "m" : "pcs"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold text-foreground">{formatPrice(item.totalPrice)}</span>
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeItem(i)}
                                  className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted">Total HT</span>
                        <span className="text-lg font-bold text-foreground">{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => {
                            setCartOpen(false);
                            router.push("/checkout");
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-foreground text-white hover:bg-accent-hover transition-all"
                        >
                          Commander <ArrowRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="sm:hidden flex items-center gap-1">
          <button
            className={`p-2 transition-colors relative ${
              showWhite ? "text-white/80 hover:text-white" : "text-muted hover:text-foreground"
            }`}
            onClick={() => { setCartOpen(!cartOpen); setMobileOpen(false); }}
          >
            <ShoppingCart size={18} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-accent text-white">
                {count}
              </span>
            )}
          </button>
          <button
            className={`p-2 transition-colors ${
              showWhite ? "text-white/80 hover:text-white" : "text-muted hover:text-foreground"
            }`}
            onClick={() => { setMobileOpen(!mobileOpen); setCartOpen(false); }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — fullscreen glass overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="sm:hidden fixed inset-0 z-[100]"
            style={{
              background: "rgba(180, 200, 220, 0.45)",
              backdropFilter: "blur(32px) saturate(1.4)",
              WebkitBackdropFilter: "blur(32px) saturate(1.4)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
              className="flex flex-col h-full px-7 pt-10 pb-8"
            >
              {/* Top — Logo */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="mb-10 inline-block"
              >
                <img src="/Impresive..svg" alt="Impressive" className="h-8 w-auto" />
              </Link>

              {/* Nav links */}
              <nav className="flex flex-col gap-1">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                  Produits
                </p>
                {[
                  { href: "/configure/metre", label: "DTF au mètre" },
                  { href: "/configure/builder", label: "Builder" },
                ].map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-lg font-semibold text-white py-2 hover:text-white/70 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="h-px bg-white/10 my-4" />

                {[
                  { href: "/checkout", label: "Panier", count },
                  {
                    href: customer ? "/compte" : "/compte/connexion",
                    label: customer ? "Mon compte" : "Connexion",
                  },
                ].map((link, i) => (
                  <motion.div
                    key={link.href + link.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-lg font-semibold text-white py-2 hover:text-white/70 transition-colors"
                    >
                      {link.label}
                      {"count" in link && typeof link.count === "number" && link.count > 0 && (
                        <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {link.count}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Bottom — Close + CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center gap-4"
              >
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X size={24} />
                </button>
                <Link
                  href={customer ? "/compte" : "/compte/inscription"}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-full bg-white text-foreground hover:bg-white/90 shadow-lg transition-all"
                >
                  {customer ? "Mon espace" : "S'inscrire"}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile cart dropdown (sm:hidden handled by parent button; desktop uses the in-button dropdown) */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="sm:hidden overflow-hidden rounded-b-2xl border-t border-white/10"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {count === 0 ? (
              <div className="px-5 py-8 text-center">
                <ShoppingBag size={28} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-foreground">Panier vide</p>
                <p className="text-xs text-muted mt-1">Configurez un produit DTF pour commencer.</p>
              </div>
            ) : (
              <>
                <div className="max-h-56 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3 border-b border-gray-100/60 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.productName}</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">
                          {item.sizeLabel} × {item.quantity} {item.productType === "metre" ? "m" : "pcs"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">{formatPrice(item.totalPrice)}</span>
                        <button onClick={() => removeItem(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">Total HT</span>
                  <span className="text-lg font-bold text-foreground">{formatPrice(totalPrice)}</span>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => { setCartOpen(false); router.push("/checkout"); }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-foreground text-white hover:bg-accent-hover transition-all"
                  >
                    Commander <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
