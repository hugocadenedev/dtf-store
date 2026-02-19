"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/pricing";
import { Trash2, ShoppingBag, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations/PageTransition";
import { FadeIn } from "@/components/animations/FadeIn";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    postalCode: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCheckout = async () => {
    const required = ["firstName", "lastName", "email", "phone", "address", "postalCode", "city"] as const;
    const missing = required.some((k) => !form[k].trim());
    if (missing) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (items.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const uploadedItems = [];
      for (const item of items) {
        let filePath = "";
        let fileName = item.fileName;

        if (item.file) {
          const formData = new FormData();
          formData.append("file", item.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadData = await uploadRes.json();
          if (uploadData.path) {
            filePath = uploadData.path;
            fileName = uploadData.fileName;
          }
        }

        uploadedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sizeLabel: item.sizeLabel,
          fileName,
          filePath,
        });
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: form.email,
          customerName: `${form.firstName} ${form.lastName}`,
          customerFirstName: form.firstName,
          customerLastName: form.lastName,
          customerPhone: form.phone,
          customerCompany: form.company,
          customerAddress: form.address,
          customerPostalCode: form.postalCode,
          customerCity: form.city,
          items: uploadedItems,
        }),
      });

      const data = await res.json();

      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        setError(data.error || "Erreur lors de la creation du paiement.");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageTransition>
        <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
          <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
            <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 pb-12 sm:pb-16 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag size={36} className="text-white/60" strokeWidth={1.5} />
                </div>
              </motion.div>
              <FadeIn delay={0.2}>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-white hero-3d-text">Panier vide</h1>
                <p className="text-sm text-white/70 mb-8">
                  Configurez un produit DTF pour commencer.
                </p>
                <button onClick={() => router.push("/")} className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-foreground font-semibold rounded-full hover:bg-white/90 transition-all shadow-lg">
                  Retour a l&apos;accueil <ArrowRight size={14} />
                </button>
              </FadeIn>
            </div>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* White frame + gradient header */}
      <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
        <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8 pb-0 sm:pb-0">
          <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 pb-10 sm:pb-12 text-center">
            <FadeIn>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white hero-3d-text">
                Checkout
              </h1>
              <p className="text-sm text-white/70 mt-3">Finalisez votre commande</p>
            </FadeIn>
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">

        {/* Cart items */}
        <FadeIn delay={0.1}>
          <div className="card overflow-hidden mb-8">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  layout
                  exit={{ opacity: 0, x: -50 }}
                  className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.productName}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {item.sizeLabel} x {item.quantity}{" "}
                      {item.productType === "metre" ? "m" : "pcs"} — {item.fileName}
                    </p>
                    {item.deliveryLabel && (
                      <p className="text-xs text-muted mt-0.5">
                        🚚 Livraison : {item.deliveryLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
                    <span className="text-sm font-bold">
                      {formatPrice(item.totalPrice)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(i)}
                      className="p-1.5 text-muted hover:text-accent transition-colors"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="px-4 sm:px-5 py-4 sm:py-5 flex justify-between bg-foreground text-white rounded-b-2xl">
              <span className="text-xs font-semibold">Total HT</span>
              <span className="text-xl font-bold">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Customer info */}
        <FadeIn delay={0.2}>
          <div className="mb-8">
            <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Vos informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Prénom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="jean@entreprise.fr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Téléphone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted mb-2">
                  Nom de l&apos;entreprise <span className="text-muted/50">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={set("company")}
                  placeholder="Ma Société SAS"
                />
              </div>
            </div>

            <h2 className="text-sm font-bold text-foreground mt-8 mb-4 uppercase tracking-wider">Adresse de livraison</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted mb-2">
                  Adresse <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={set("address")}
                  placeholder="12 Rue de la Paix"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Code postal <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={set("postalCode")}
                  placeholder="75001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Ville <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set("city")}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>
        </FadeIn>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-red-500 border border-red-200 bg-red-50 rounded-xl px-4 py-2.5 mb-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <FadeIn delay={0.3}>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-40 text-sm py-4"
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Validation en cours...
              </motion.span>
            ) : (
              <>
                <Lock size={14} /> Valider ma commande
              </>
            )}
          </button>

          <p className="text-xs text-muted text-center mt-4 flex items-center justify-center gap-1.5">
            <Lock size={10} />
            Paiement sécurisé
          </p>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
