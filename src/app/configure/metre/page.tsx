"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import { PriceTable } from "@/components/PriceTable";
import { FileUploader } from "@/components/FileUploader";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";
import type { PriceTier } from "@/lib/pricing";
import { getUnitPrice, calculateTotal, formatPrice } from "@/lib/pricing";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations/PageTransition";
import { FadeIn } from "@/components/animations/FadeIn";
import { ArrowRight, ArrowLeft, ShoppingCart, Ruler, Info, LayoutPanelTop, X } from "lucide-react";
import { Particles } from "@/components/animations/Particles";
import { DeliveryPicker } from "@/components/DeliveryPicker";
import { BuilderModal } from "@/components/builder/BuilderModal";

const STEPS = ["Configuration", "Fichier", "Résumé"];

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export default function MetreConfigurator() {
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryLabel, setDeliveryLabel] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderFile, setBuilderFile] = useState<{ file: File; metrage: number } | null>(null);

  useEffect(() => {
    fetch("/api/products?type=metre")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (data.length > 0) {
          const p = data[0];
          setProduct(p);
          setTiers(
            p.tiers.map((t) => ({
              id: t.id,
              minQty: t.minQty,
              maxQty: t.maxQty,
              unitPrice: t.unitPrice,
              label: t.label,
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const effectiveQuantity = builderFile ? builderFile.metrage : quantity;
  const unitPrice = getUnitPrice(tiers, effectiveQuantity);
  const total = calculateTotal(tiers, effectiveQuantity);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productType: "metre",
      quantity: effectiveQuantity,
      unitPrice,
      totalPrice: total,
      sizeLabel: builderFile ? `${effectiveQuantity}m (planche)` : `${quantity}m`,
      file: builderFile ? builderFile.file : file,
      fileName: builderFile ? "planche-dtf.pdf" : (file?.name ?? ""),
      deliveryDate,
      deliveryLabel,
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
                      {/* ★ Créer ma planche — prominent CTA */}
                      <FadeIn>
                        <button
                          onClick={() => setBuilderOpen(true)}
                          className="w-full glass-strong rounded-2xl p-5 text-left group hover:shadow-xl hover:shadow-black/10 transition-all cursor-pointer border-2 border-transparent hover:border-white/60"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shrink-0">
                              <LayoutPanelTop size={22} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-base font-bold text-slate-800">Créer ma planche</p>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-white">
                                  Éditeur
                                </span>
                              </div>
                              <p className="text-[12px] text-slate-500 mt-0.5">
                                Placez vos visuels sur un rouleau DTF. Le métrage est calculé automatiquement.
                              </p>
                            </div>
                            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                          </div>
                          {builderFile && (
                            <div className="mt-3 flex items-center gap-2 bg-green-100/60 rounded-xl px-3 py-2 border border-green-200/60">
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <p className="text-xs font-semibold text-green-800">
                                Planche créée — {builderFile.metrage}m
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); setBuilderFile(null); }}
                                className="ml-auto text-green-600 hover:text-green-800 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </button>
                      </FadeIn>

                      {/* Separator */}
                      {!builderFile && (
                        <div className="flex items-center gap-3 px-2">
                          <div className="flex-1 h-px bg-white/30" />
                          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">ou choisir le métrage manuellement</span>
                          <div className="flex-1 h-px bg-white/30" />
                        </div>
                      )}

                      {/* Quantity — hidden if builder has a file */}
                      {!builderFile && (
                        <FadeIn>
                          <div className="glass rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-800/10 flex items-center justify-center">
                                <Ruler size={14} className="text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Longueur souhaitée</p>
                                <p className="text-[11px] text-slate-500">En mètres linéaires</p>
                              </div>
                            </div>
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                              className="text-lg font-bold text-center !bg-white/40 !border-slate-300/50 !text-slate-800 placeholder:text-slate-400 focus:!border-slate-400"
                            />
                          </div>
                        </FadeIn>
                      )}

                      {/* Price table */}
                      <FadeIn delay={0.05}>
                        <div className="glass rounded-2xl overflow-hidden">
                          <div className="px-5 py-3 border-b border-slate-200/60">
                            <p className="text-xs font-semibold text-slate-600">Grille tarifaire</p>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200/60 text-left">
                                <th className="px-5 py-2.5 font-medium text-slate-500 text-xs">Quantité</th>
                                <th className="px-5 py-2.5 font-medium text-slate-500 text-xs text-right">Prix / m</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...tiers].sort((a, b) => a.minQty - b.minQty).map((tier) => {
                                const isActive = quantity >= tier.minQty && quantity <= tier.maxQty;
                                return (
                                  <tr
                                    key={tier.id}
                                    className={`border-b border-slate-200/40 last:border-0 transition-colors ${isActive ? "bg-white/40" : ""}`}
                                  >
                                    <td className={`px-5 py-2.5 ${isActive ? "text-slate-800 font-semibold" : "text-slate-500"}`}>
                                      {tier.label
                                        ? tier.label
                                        : tier.maxQty >= 99999
                                        ? `${tier.minQty}m+`
                                        : `${tier.minQty} – ${tier.maxQty}m`}
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

                      {/* Delivery picker */}
                      <FadeIn delay={0.1}>
                        <div className="glass rounded-2xl p-5 ring-1 ring-slate-200/40">
                          <DeliveryPicker
                            value={deliveryDate}
                            onChange={(date, label) => {
                              setDeliveryDate(date);
                              setDeliveryLabel(label);
                            }}
                            variant="light"
                          />
                        </div>
                      </FadeIn>
                    </div>

                    {/* Right column — sticky summary */}
                    <div className="lg:col-span-5">
                      <div className="lg:sticky lg:top-24">
                        <FadeIn delay={0.15}>
                          <div className="glass-strong rounded-2xl overflow-hidden ring-1 ring-slate-200/40 shadow-2xl shadow-black/10">
                            <div className="px-5 py-4 border-b border-slate-200/60">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Récapitulatif</p>
                            </div>
                            <div className="p-5 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Produit</span>
                                <span className="text-sm font-semibold text-slate-800">{product.name}</span>
                              </div>
                              {builderFile && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-xs text-slate-500">Mode</span>
                                  <span className="text-[11px] font-semibold bg-slate-800 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <LayoutPanelTop size={10} /> Planche
                                  </span>
                                </motion.div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Longueur</span>
                                <span className="text-sm font-bold text-slate-800">{effectiveQuantity.toFixed(2)}m</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Prix unitaire</span>
                                <span className="text-sm font-bold text-slate-800">{formatPrice(unitPrice)}/m</span>
                              </div>
                              {deliveryLabel && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-xs text-slate-500">Livraison</span>
                                  <span className="text-[11px] font-semibold bg-slate-800 text-white px-2.5 py-1 rounded-full">
                                    {deliveryLabel}
                                  </span>
                                </motion.div>
                              )}
                            </div>
                            <div className="px-5 py-5 bg-slate-800/90 border-t border-slate-700">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Total HT</span>
                                <span className="text-3xl font-bold text-white">{formatPrice(total)}</span>
                              </div>
                            </div>
                            <div className="p-4">
                              <button
                                onClick={() => setStep(builderFile ? 2 : 1)}
                                disabled={!deliveryDate}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 font-semibold text-sm bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                {builderFile ? "Vérifier & commander" : "Continuer"} <ArrowRight size={14} />
                              </button>
                              {!deliveryDate && (
                                <p className="text-[10px] text-center text-slate-400 mt-2">
                                  Sélectionnez un délai de livraison pour continuer
                                </p>
                              )}
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
                          {builderFile && (
                            <div className="px-5 py-3.5 flex justify-between items-center">
                              <span className="text-xs text-slate-500">Mode</span>
                              <span className="text-[11px] font-semibold bg-slate-800 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                                <LayoutPanelTop size={10} /> Planche
                              </span>
                            </div>
                          )}
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Longueur</span>
                            <span className="text-sm font-bold text-slate-800">{effectiveQuantity.toFixed(2)}m</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Prix unitaire</span>
                            <span className="text-sm font-bold text-slate-800">{formatPrice(unitPrice)}/m</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between">
                            <span className="text-xs text-slate-500">Fichier</span>
                            <span className="text-sm font-bold text-slate-800 truncate ml-4">{builderFile ? "planche-dtf.pdf" : (file?.name ?? "—")}</span>
                          </div>
                          <div className="px-5 py-3.5 flex justify-between items-center">
                            <span className="text-xs text-slate-500">Livraison</span>
                            <span className="text-[11px] font-semibold bg-slate-800 text-white px-2.5 py-1 rounded-full">
                              {deliveryLabel || "—"}
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
                        <button onClick={() => setStep(builderFile ? 0 : 1)} className="btn-secondary flex-1 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
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

            {/* ═══ Description ═══ */}
            {product.description && (
              <div className="relative z-10 px-4 sm:px-6 md:px-10 pb-8">
                <FadeIn delay={0.3}>
                  <div className="mx-auto max-w-xl">
                    <div className="inline-flex items-start gap-2.5 glass rounded-2xl px-5 py-4 text-left">
                      <Info size={14} className="text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Builder modal */}
      <BuilderModal
        open={builderOpen}
        tiers={tiers}
        onClose={() => setBuilderOpen(false)}
        onConfirm={(file, metrage) => {
          setBuilderFile({ file, metrage });
          setBuilderOpen(false);
        }}
      />
    </PageTransition>
  );
}
