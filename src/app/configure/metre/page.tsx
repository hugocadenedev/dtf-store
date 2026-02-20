"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { ArrowRight, ArrowLeft, ShoppingCart, Info, LayoutPanelTop, X, Upload, ImageIcon, Minus, Plus } from "lucide-react";
import { Particles } from "@/components/animations/Particles";
import { Truck } from "lucide-react";
import { BuilderModal } from "@/components/builder/BuilderModal";
import { autoLayoutLogos, getObjectBounds } from "@/components/builder/types";
import type { LogoEntry } from "@/components/builder/types";
import { generateBoardPdf } from "@/lib/pdfExport";

const STEPS = ["Configuration", "Récapitulatif"];

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

  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderFile, setBuilderFile] = useState<{ file: File; metrage: number } | null>(null);

  /* ─── Quick config state ─── */
  const [quickLogo, setQuickLogo] = useState<{ src: string; naturalWidth: number; naturalHeight: number; fileName: string } | null>(null);
  const [quickWidth, setQuickWidth] = useState(8);
  const [quickHeight, setQuickHeight] = useState(8);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [quickSpacing, setQuickSpacing] = useState(0.5);
  const [quickGenerating, setQuickGenerating] = useState(false);
  const quickFileRef = useRef<HTMLInputElement>(null);

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

  /* ─── Quick config: compute layout + metrage ─── */
  const quickLayout = useMemo(() => {
    if (!quickLogo) return null;
    const logoEntry: LogoEntry = {
      id: "quick",
      src: quickLogo.src,
      naturalWidth: quickLogo.naturalWidth,
      naturalHeight: quickLogo.naturalHeight,
      fileName: quickLogo.fileName,
      widthCm: quickWidth,
      heightCm: quickHeight,
      quantity: quickQuantity,
    };
    const result = autoLayoutLogos([logoEntry], 55, [], quickSpacing);
    let maxY = 0;
    for (const obj of result.objects) {
      maxY = Math.max(maxY, getObjectBounds(obj).maxY);
    }
    const metrageUsed = Math.ceil(maxY) / 100;
    const metrage = Math.max(1, Math.ceil(metrageUsed));
    return { ...result, metrageUsed, metrage };
  }, [quickLogo, quickWidth, quickHeight, quickQuantity, quickSpacing]);

  const handleQuickWidthChange = useCallback((w: number) => {
    setQuickWidth(w);
    if (quickLogo) {
      const aspect = quickLogo.naturalWidth / quickLogo.naturalHeight;
      setQuickHeight(parseFloat((w / aspect).toFixed(1)));
    }
  }, [quickLogo]);

  const handleQuickHeightChange = useCallback((h: number) => {
    setQuickHeight(h);
    if (quickLogo) {
      const aspect = quickLogo.naturalWidth / quickLogo.naturalHeight;
      setQuickWidth(parseFloat((h * aspect).toFixed(1)));
    }
  }, [quickLogo]);

  const handleQuickFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setQuickLogo({
          src: dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          fileName: f.name,
        });
        setBuilderFile(null);
        const aspect = img.naturalWidth / img.naturalHeight;
        const w = Math.min(8, 59);
        const h = parseFloat((w / aspect).toFixed(1));
        setQuickWidth(w);
        setQuickHeight(h);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }, []);

  const handleQuickContinue = useCallback(async () => {
    if (!quickLayout) return;
    setQuickGenerating(true);
    try {
      const pdfBytes = await generateBoardPdf(quickLayout.objects, 55, quickLayout.newBoardHeight);
      const pdfFile = new File([pdfBytes.buffer as ArrayBuffer], "planche-dtf.pdf", { type: "application/pdf" });
      setBuilderFile({ file: pdfFile, metrage: quickLayout.metrage });
      setStep(1);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setQuickGenerating(false);
    }
  }, [quickLayout]);

  const effectiveQuantity = builderFile ? builderFile.metrage : (quickLayout ? quickLayout.metrage : quantity);
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
      sizeLabel: builderFile ? `${effectiveQuantity}m (planche)` : `${effectiveQuantity}m`,
      file: builderFile ? builderFile.file : file,
      fileName: builderFile ? "planche-dtf.pdf" : (file?.name ?? ""),
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
                          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">ou configurer rapidement</span>
                          <div className="flex-1 h-px bg-white/30" />
                        </div>
                      )}

                      {/* Quick Logo Config — hidden if builder has a file */}
                      {!builderFile && (
                        <FadeIn>
                          <div className="glass rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-slate-800/10 flex items-center justify-center">
                                <ImageIcon size={14} className="text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Configuration rapide</p>
                                <p className="text-[11px] text-slate-500">Déposez un logo, on génère la planche pour vous</p>
                              </div>
                            </div>

                            {/* Upload zone or preview */}
                            {!quickLogo ? (
                              <button
                                onClick={() => quickFileRef.current?.click()}
                                className="w-full border-2 border-dashed border-slate-300/60 hover:border-slate-400 rounded-xl p-5 flex flex-col items-center gap-2 transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-slate-100/60 group-hover:bg-slate-200/60 flex items-center justify-center transition-colors">
                                  <Upload size={18} className="text-slate-500" />
                                </div>
                                <span className="text-xs font-medium text-slate-600">Cliquez pour déposer votre logo</span>
                                <span className="text-[10px] text-slate-400">PNG, JPG, SVG</span>
                              </button>
                            ) : (
                              <div className="bg-white/40 rounded-xl p-3 border border-white/50">
                                <div className="flex gap-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center overflow-hidden shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={quickLogo.src} alt="" className="max-w-full max-h-full object-contain" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <p className="text-xs font-semibold text-slate-800 truncate">{quickLogo.fileName}</p>
                                      <button onClick={() => { setQuickLogo(null); }} className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{quickLogo.naturalWidth} × {quickLogo.naturalHeight} px</p>
                                    {(() => {
                                      const dpi = Math.round(Math.min(
                                        (quickLogo.naturalWidth * 2.54) / quickWidth,
                                        (quickLogo.naturalHeight * 2.54) / quickHeight
                                      ));
                                      return (
                                        <p className={`text-[10px] font-semibold mt-1 ${dpi >= 300 ? "text-green-600" : dpi >= 150 ? "text-yellow-600" : "text-red-500"}`}>
                                          {dpi} DPI {dpi >= 300 ? "✓" : "⚠️"}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">Largeur (cm)</label>
                                    <input
                                      type="number"
                                      value={quickWidth}
                                      onChange={(e) => handleQuickWidthChange(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                                      step={0.5}
                                      min={0.5}
                                      max={59}
                                      className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">Hauteur (cm)</label>
                                    <input
                                      type="number"
                                      value={quickHeight}
                                      onChange={(e) => handleQuickHeightChange(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                                      step={0.5}
                                      min={0.5}
                                      className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">Quantité</label>
                                    <div className="flex items-center mt-1 bg-white/50 border border-white/60 rounded-lg">
                                      <button onClick={() => setQuickQuantity((q) => Math.max(1, q - 1))} className="px-2 py-1.5 hover:bg-white/40 rounded-l-lg transition-colors">
                                        <Minus size={11} className="text-slate-600" />
                                      </button>
                                      <input
                                        type="number"
                                        value={quickQuantity}
                                        onChange={(e) => setQuickQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        min={1}
                                        className="w-full text-center text-xs font-bold !bg-transparent !border-x !border-white/50 !text-slate-800 py-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button onClick={() => setQuickQuantity((q) => q + 1)} className="px-2 py-1.5 hover:bg-white/40 rounded-r-lg transition-colors">
                                        <Plus size={11} className="text-slate-600" />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">Espacement (cm)</label>
                                    <input
                                      type="number"
                                      value={quickSpacing}
                                      onChange={(e) => setQuickSpacing(Math.max(0, parseFloat(e.target.value) || 0))}
                                      step={0.1}
                                      min={0}
                                      max={10}
                                      className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                </div>

                                {/* Calculated metrage */}
                                {quickLayout && (
                                  <div className="mt-3 bg-slate-800/10 rounded-xl px-3 py-2.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Longueur calculée</span>
                                      <span className="text-sm font-bold text-slate-800">{quickLayout.metrage}m</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <input ref={quickFileRef} type="file" accept="image/*" onChange={handleQuickFileUpload} className="hidden" />
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
                                const isActive = effectiveQuantity >= tier.minQty && effectiveQuantity <= tier.maxQty;
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

                      {/* Delivery info */}
                      <FadeIn delay={0.1}>
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
                                onClick={() => {
                                  if (builderFile) {
                                    setStep(1);
                                  } else if (quickLayout) {
                                    handleQuickContinue();
                                  }
                                }}
                                disabled={(!builderFile && !quickLayout) || quickGenerating}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 font-semibold text-sm bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                {quickGenerating ? "Génération…" : builderFile ? "Vérifier & commander" : quickLayout ? "Générer la planche & commander" : "Continuer"} <ArrowRight size={14} />
                              </button>
                              {!builderFile && !quickLayout && (
                                <p className="text-[10px] text-center text-slate-400 mt-2">
                                  Créez une planche ou configurez un logo pour continuer
                                </p>
                              )}
                            </div>
                          </div>
                        </FadeIn>

                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ────── Step 1: Summary ────── */}
                {step === 1 && (
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
                            <span className="text-sm font-bold text-slate-800 truncate ml-4">planche-dtf.pdf</span>
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
                        <button onClick={() => setStep(0)} className="btn-secondary flex-1 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
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

      {/* Builder modal */}
      <BuilderModal
        open={builderOpen}
        tiers={tiers}
        onClose={() => setBuilderOpen(false)}
        onConfirm={(file, metrage) => {
          setBuilderFile({ file, metrage });
          setQuickLogo(null);
          setBuilderOpen(false);
        }}
      />
    </PageTransition>
  );
}
