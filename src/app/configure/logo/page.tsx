"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import { FileUploader } from "@/components/FileUploader";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";
import type { PriceTier } from "@/lib/pricing";
import { getUnitPrice, calculateTotal, formatPrice } from "@/lib/pricing";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations/PageTransition";
import { FadeIn } from "@/components/animations/FadeIn";
import { ArrowRight, ArrowLeft, ShoppingCart, Grid3X3, Hash, Info, Truck } from "lucide-react";
import { Particles } from "@/components/animations/Particles";


const STEPS = ["Configuration", "Fichier", "Résumé"];

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

/** Group tiers by label (size) */
function groupBySize(tiers: PriceTier[]): Map<string, PriceTier[]> {
  const map = new Map<string, PriceTier[]>();
  for (const t of tiers) {
    const key = t.label || "Standard";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

export default function LogoConfigurator() {
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [allTiers, setAllTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [file, setFile] = useState<File | null>(null);


  useEffect(() => {
    fetch("/api/products?type=logo")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (data.length > 0) {
          const p = data[0];
          setProduct(p);
          const mapped = p.tiers.map((t) => ({
            id: t.id,
            minQty: t.minQty,
            maxQty: t.maxQty,
            unitPrice: t.unitPrice,
            label: t.label,
          }));
          setAllTiers(mapped);
          const sizes = groupBySize(mapped);
          const firstSize = sizes.keys().next().value;
          if (firstSize) setSelectedSize(firstSize);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sizeGroups = groupBySize(allTiers);
  const sizes = Array.from(sizeGroups.keys());
  const currentTiers = sizeGroups.get(selectedSize) ?? [];

  const unitPrice = getUnitPrice(currentTiers, quantity);
  const total = calculateTotal(currentTiers, quantity);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productType: "logo",
      quantity,
      unitPrice,
      totalPrice: total,
      sizeLabel: selectedSize,
      file,
      fileName: file?.name ?? "",
    });
    router.push("/checkout");
  };

  if (loading) {
    return (
      <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
        <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
          <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center" style={{ minHeight: "calc(100vh - 3rem)" }}>
            <Particles count={50} />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative z-10 text-white/60 text-sm font-medium"
            >
              Chargement...
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
        <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
          <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center" style={{ minHeight: "calc(100vh - 3rem)" }}>
            <Particles count={50} />
            <p className="relative z-10 text-white/60 text-sm uppercase tracking-widest">Produit non disponible.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <PageTransition>
      <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
        <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
          <div
            className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex flex-col"
            style={{ minHeight: "calc(100vh - 3rem)" }}
          >
            {/* Particles */}
            <Particles count={50} />

            {/* Spacer for header */}
            <div className="h-14 sm:h-20" />

            {/* ═══ Title + Description + Steps ═══ */}
            <div className="text-center px-4 sm:px-6 md:px-10 relative z-10">
              <FadeIn>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white hero-3d-text">
                  {product.name}
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="mt-6">
                  <StepIndicator currentStep={step} steps={STEPS} variant="light" />
                </div>
              </FadeIn>
            </div>

            {/* ═══ Content area ═══ */}
            <div className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
              <AnimatePresence mode="wait">
                {/* ────── Step 0: Configuration ────── */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
                  >
                    {/* Left column — config inputs */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Size selector */}
                      <FadeIn>
                        <div className="glass rounded-2xl p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800/10 flex items-center justify-center">
                              <Grid3X3 size={14} className="text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Format</p>
                              <p className="text-[11px] text-slate-500">Choisissez la taille du logo</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {sizes.map((size) => (
                              <motion.button
                                key={size}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedSize(size)}
                                className={`py-3 px-3 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                                  selectedSize === size
                                    ? "border-slate-800 bg-slate-800 text-white shadow-md"
                                    : "border-slate-300/60 text-slate-600 hover:border-slate-400 hover:bg-white/30"
                                }`}
                              >
                                {size}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </FadeIn>

                      {/* Quantity */}
                      <FadeIn delay={0.05}>
                        <div className="glass rounded-2xl p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800/10 flex items-center justify-center">
                              <Hash size={14} className="text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Quantité</p>
                              <p className="text-[11px] text-slate-500">Nombre de logos</p>
                            </div>
                          </div>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="text-lg font-bold text-center !bg-white/40 !border-slate-300/50 !text-slate-800 placeholder:text-slate-400 focus:!border-slate-400"
                          />
                        </div>
                      </FadeIn>

                      {/* Price table */}
                      <FadeIn delay={0.1}>
                        <div className="glass rounded-2xl overflow-hidden">
                          <div className="px-5 py-3 border-b border-slate-200/60">
                            <p className="text-xs font-semibold text-slate-600">Grille tarifaire</p>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200/60 text-left">
                                <th className="px-5 py-2.5 font-medium text-slate-500 text-xs">Quantité</th>
                                <th className="px-5 py-2.5 font-medium text-slate-500 text-xs text-right">Prix / pce</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...currentTiers].sort((a, b) => a.minQty - b.minQty).map((tier) => {
                                const isActive = quantity >= tier.minQty && quantity <= tier.maxQty;
                                return (
                                  <tr
                                    key={tier.id}
                                    className={`border-b border-slate-200/40 last:border-0 transition-colors ${isActive ? "bg-white/40" : ""}`}
                                  >
                                    <td className={`px-5 py-2.5 ${isActive ? "text-slate-800 font-semibold" : "text-slate-500"}`}>
                                      {tier.maxQty >= 99999
                                        ? `${tier.minQty}+`
                                        : `${tier.minQty} – ${tier.maxQty}`}
                                    </td>
                                    <td className={`px-5 py-2.5 text-right ${isActive ? "text-slate-800 font-semibold" : "text-slate-500"}`}>
                                      {formatPrice(tier.unitPrice)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </FadeIn>

                      {/* Delivery info */}
                      <FadeIn delay={0.15}>
                        <div className="glass rounded-2xl p-5 ring-1 ring-slate-200/40">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800/10 flex items-center justify-center">
                              <Truck size={14} className="text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Livraison</p>
                              <p className="text-[11px] text-slate-500">3 jours ouvrés de production + 24h de livraison max</p>
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    </div>

                    {/* Right column — sticky summary */}
                    <div className="lg:col-span-5">
                      <div className="lg:sticky lg:top-24 space-y-6">
                        {/* ═══ Fiche technique DTF ═══ */}
                        <FadeIn delay={0.1}>
                          <div className="glass rounded-2xl ring-1 ring-slate-200/40 overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-200/60 bg-slate-50/50">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fiche technique</p>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {/* Applications */}
                              <div className="px-5 py-3.5">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Applications</p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  Textiles clairs et foncés : coton, polyester-coton, viscose, vêtements légers, extérieur, accessoires et fibres naturelles.
                                </p>
                              </div>
                              {/* Impression */}
                              <div className="px-5 py-3.5">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Impression</p>
                                <p className="text-xs text-slate-600">Quadri · Quadri+Blanc · Blanc</p>
                              </div>
                              {/* Entretien */}
                              <div className="px-5 py-3.5">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Entretien</p>
                                <div className="flex items-center gap-3 text-slate-500">
                                  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="6" width="24" height="18" rx="2" />
                                    <path d="M6 14c2-4 4-4 6 0s4 4 6 0" />
                                    <text x="14" y="5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="600">90°</text>
                                  </svg>
                                  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polygon points="14,4 26,24 2,24" />
                                  </svg>
                                  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="4" width="24" height="20" rx="3" />
                                    <circle cx="14" cy="14" r="6" />
                                  </svg>
                                  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M6 20h16l2 4H4l2-4z" />
                                    <path d="M8 20V10a4 4 0 014-4h4a4 4 0 014 4v10" />
                                  </svg>
                                  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="14" cy="14" r="11" />
                                    <line x1="6" y1="6" x2="22" y2="22" />
                                  </svg>
                                </div>
                              </div>
                              {/* Caractéristiques */}
                              <div className="px-5 py-3.5">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Caractéristiques</p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  Rendu couleur optimal, sensation fine et douce au toucher. Forte tenue et flexibilité.
                                </p>
                              </div>
                              {/* Conditions de pose */}
                              <div className="px-5 py-3.5">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Conditions de pose</p>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-50">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <path d="M12 2v20M8 6h8M6 10h12M9 18h6" />
                                    </svg>
                                    <span className="text-xs font-bold text-slate-700">150°C</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-50">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <circle cx="12" cy="12" r="9" />
                                      <path d="M12 7v5l3 3" />
                                    </svg>
                                    <span className="text-xs font-bold text-slate-700">12 sec</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-50">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <path d="M12 2v6M6 8h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
                                      <path d="M9 22h6" />
                                    </svg>
                                    <span className="text-xs font-bold text-slate-700">3 Bars</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-200/60">
                              <p className="text-[10px] text-slate-400 text-center">* Ces indications peuvent varier selon le textile marqué.</p>
                            </div>
                          </div>
                        </FadeIn>

                        {/* ═══ Description ═══ */}
                        {product.description && (
                          <FadeIn delay={0.15}>
                            <div className="glass rounded-2xl p-5 ring-1 ring-slate-200/40">
                              <div className="flex items-start gap-3">
                                <Info size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </FadeIn>
                        )}

                        <FadeIn delay={0.2}>
                          <div className="glass-strong rounded-2xl overflow-hidden ring-1 ring-slate-200/40 shadow-2xl shadow-black/10">
                            <div className="px-5 py-4 border-b border-slate-200/60">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Récapitulatif</p>
                            </div>
                            <div className="p-5 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Produit</span>
                                <span className="text-sm font-semibold text-slate-800">{product.name}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Format</span>
                                <span className="text-sm font-bold text-slate-800">{selectedSize}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Quantité</span>
                                <span className="text-sm font-bold text-slate-800">{quantity} pcs</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Prix unitaire</span>
                                <span className="text-sm font-bold text-slate-800">{formatPrice(unitPrice)}/pce</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Livraison</span>
                                <span className="text-[11px] font-semibold bg-slate-800 text-white px-2.5 py-1 rounded-full">
                                  3j ouvrés + 24h
                                </span>
                              </div>
                            </div>
                            <div className="px-5 py-5 bg-slate-800/90 border-t border-slate-700">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Total HT</span>
                                <span className="text-3xl font-bold text-white">{formatPrice(total)}</span>
                              </div>
                            </div>
                            <div className="p-4">
                              <button
                                onClick={() => setStep(1)}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 font-semibold text-sm bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all shadow-lg"
                              >
                                Continuer <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        </FadeIn>

                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ────── Step 1: Upload ────── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="max-w-md mx-auto"
                  >
                    <FadeIn>
                      <label className="block text-xs font-semibold text-white mb-3">
                        Votre fichier d&apos;impression
                      </label>
                      <FileUploader onFileSelected={(f) => setFile(f)} variant="glass" />

                      <div className="flex gap-3 mt-8">
                        <button onClick={() => setStep(0)} className="btn-secondary flex-1 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
                          <ArrowLeft size={14} /> Retour
                        </button>
                        <button
                          onClick={() => setStep(2)}
                          disabled={!file}
                          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 font-semibold text-sm bg-white text-foreground rounded-full hover:bg-white/90 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Continuer <ArrowRight size={14} />
                        </button>
                      </div>
                    </FadeIn>
                  </motion.div>
                )}

                {/* ────── Step 2: Summary ────── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="max-w-md mx-auto"
                  >
                    <FadeIn>
                      <div className="glass-strong rounded-2xl overflow-hidden ring-1 ring-slate-200/40 shadow-2xl shadow-black/10">
                        <div className="px-5 py-4 border-b border-slate-200/60">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Votre commande</p>
                        </div>
                        <div className="divide-y divide-slate-200/60">
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Produit</span>
                            <span className="text-sm font-bold text-slate-800">{product.name}</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Format</span>
                            <span className="text-sm font-bold text-slate-800">{selectedSize}</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Quantité</span>
                            <span className="text-sm font-bold text-slate-800">{quantity} pcs</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Prix unitaire</span>
                            <span className="text-sm font-bold text-slate-800">{formatPrice(unitPrice)}</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Fichier</span>
                            <span className="text-sm font-bold text-slate-800 truncate ml-4">{file?.name ?? "—"}</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between items-center">
                            <span className="text-xs text-slate-500">Livraison</span>
                            <span className="text-[11px] font-semibold bg-slate-800 text-white px-2.5 py-1 rounded-full">
                              3j ouvrés + 24h
                            </span>
                          </div>
                        </div>
                        <div className="px-5 py-5 bg-slate-800/90 border-t border-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Total HT</span>
                            <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-8">
                        <button onClick={() => setStep(1)} className="btn-secondary flex-1 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
                          <ArrowLeft size={14} /> Retour
                        </button>
                        <button onClick={handleAddToCart} className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 font-semibold text-sm bg-white text-foreground rounded-full hover:bg-white/90 transition-all shadow-lg">
                          <ShoppingCart size={14} /> Ajouter au panier
                        </button>
                      </div>
                    </FadeIn>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
