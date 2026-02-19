"use client";

import Link from "next/link";
import { ArrowRight, Ruler, Image as ImageIcon, LayoutPanelTop, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/animations/FadeIn";
import { Particles } from "@/components/animations/Particles";

/* ═══════════════════════════════════════════════════════════
   Minimalist line-art SVG — dark strokes on white background
   ═══════════════════════════════════════════════════════════ */

function PlancheMetre() {
  return (
    <svg viewBox="0 0 280 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <filter id="paperShadowM" x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.10" />
        </filter>
      </defs>
      {/* Paper background */}
      <rect x="14" y="14" width="252" height="332" rx="14" fill="white" filter="url(#paperShadowM)" />
      <rect x="14" y="14" width="252" height="332" rx="14" stroke="#e2e8f0" strokeWidth="1" fill="none" />

      {/* Grid dashes */}
      <line x1="14" y1="90" x2="266" y2="90" stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="5 3" />
      <line x1="14" y1="162" x2="266" y2="162" stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="5 3" />
      <line x1="14" y1="234" x2="266" y2="234" stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="5 3" />
      <line x1="140" y1="14" x2="140" y2="346" stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="5 3" />

      {/* Labels */}
      <rect x="28" y="24" width="60" height="18" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <text x="58" y="37" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">60 cm</text>
      <rect x="210" y="24" width="40" height="18" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <text x="230" y="37" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">1 m</text>

      {/* Row 1 */}
      <rect x="34" y="52" width="44" height="30" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="88" y="52" width="44" height="30" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="142" y="52" width="44" height="30" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="196" y="52" width="44" height="30" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Row 2 */}
      <circle cx="56" cy="125" r="17" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="88" y="108" width="44" height="34" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="142" y="112" width="44" height="26" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <circle cx="218" cy="125" r="17" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Row 3 */}
      <rect x="34" y="178" width="60" height="34" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <circle cx="140" cy="195" r="17" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="176" y="178" width="64" height="34" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Row 4 */}
      <rect x="34" y="250" width="44" height="40" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="90" y="250" width="64" height="40" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <circle cx="202" cy="270" r="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Scissors cut line */}
      <line x1="8" y1="306" x2="272" y2="306" stroke="#94a3b8" strokeWidth="1" strokeDasharray="7 4" />
      <text x="140" y="328" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="sans-serif">✂ Découpe</text>
    </svg>
  );
}

function PlancheLogo() {
  return (
    <svg viewBox="0 0 280 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <filter id="paperShadowL" x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.10" />
        </filter>
      </defs>
      {/* Paper background */}
      <rect x="14" y="14" width="252" height="332" rx="14" fill="white" filter="url(#paperShadowL)" />
      <rect x="14" y="14" width="252" height="332" rx="14" stroke="#e2e8f0" strokeWidth="1" fill="none" />

      {/* Labels */}
      <rect x="28" y="24" width="76" height="18" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <text x="66" y="37" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">10 × 10 cm</text>
      <rect x="172" y="24" width="60" height="18" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <text x="202" y="37" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">× 50 pcs</text>

      {/* Grid of logos — kiss-cut placeholders */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <g key={`${row}-${col}`} transform={`translate(${28 + col * 58}, ${52 + row * 56})`}>
            <rect width="46" height="42" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="3 2" />
            <circle cx="16" cy="21" r="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.7" />
            <rect x="27" y="13" width="12" height="16" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.7" />
          </g>
        ))
      )}
    </svg>
  );
}

function PlancheConfig() {
  return (
    <svg viewBox="0 0 320 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <filter id="paperShadowC" x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.10" />
        </filter>
      </defs>
      {/* Paper background */}
      <rect x="10" y="10" width="300" height="380" rx="18" fill="white" filter="url(#paperShadowC)" />
      <rect x="10" y="10" width="300" height="380" rx="18" stroke="#e2e8f0" strokeWidth="1" fill="none" />

      {/* Header bar */}
      <rect x="22" y="22" width="276" height="38" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <text x="160" y="46" fill="#475569" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Planche DTF — #248</text>

      {/* Big hero block top-left */}
      <rect x="28" y="72" width="106" height="76" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <text x="81" y="116" fill="#94a3b8" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">BRAND</text>

      {/* Smaller blocks top-right */}
      <rect x="146" y="72" width="70" height="34" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />
      <rect x="146" y="114" width="70" height="34" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />
      <circle cx="264" cy="89" r="24" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="264" cy="133" r="15" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.9" />

      {/* Middle row */}
      <rect x="28" y="164" width="64" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />
      <rect x="102" y="164" width="48" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />
      <rect x="160" y="164" width="48" height="50" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />
      <rect x="218" y="164" width="64" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />

      {/* Bottom row */}
      <rect x="28" y="228" width="120" height="44" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />
      <circle cx="196" cy="250" r="22" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.9" />
      <rect x="228" y="228" width="54" height="44" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.9" />

      {/* Info bar */}
      <rect x="22" y="290" width="276" height="52" rx="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.8" />
      <text x="40" y="312" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">300 dpi · PET haute qualité</text>
      <text x="200" y="310" fill="#475569" fontSize="9" fontWeight="600" fontFamily="sans-serif">Total HT</text>
      <text x="200" y="328" fill="#334155" fontSize="14" fontWeight="700" fontFamily="sans-serif">89,50 €</text>
    </svg>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* ============================================================
          White frame around the gradient — rounded blue inside
          ============================================================ */}
      <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem] pt-0">
        <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
          <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-between" style={{ minHeight: "calc(100vh - 3rem)" }}>

            {/* Particles */}
            <Particles count={70} />

            {/* Spacer for header + white frame top */}
            <div className="h-14 sm:h-20" />

            {/* ── Hero text ── */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative z-10">
              <FadeIn delay={0.1}>
                <h1 className="text-3xl sm:text-5xl md:text-[4.5rem] font-bold tracking-tight leading-[1.08] text-white drop-shadow-md">
                  Spécialiste de
                  <br />
                  l&apos;impression DTF
                </h1>
              </FadeIn>

              <FadeIn delay={0.25}>
                <p className="mt-4 sm:mt-6 text-white/90 text-sm sm:text-base md:text-lg font-semibold leading-relaxed max-w-lg mx-auto drop-shadow-sm">
                  Profitez de transferts <strong className="text-white">haute qualité</strong> et de tarifs{" "}
                  <strong className="text-white">dégressifs</strong>.
                  <br />
                  Commandez en quelques clics.
                  <br />
                  Lancement de l&apos;impression en <strong className="text-white">24 h garanti</strong>.
                </p>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="mt-8 sm:mt-10">
                  <Link
                    href="/configure/metre"
                    className="btn-primary text-sm sm:text-base px-8 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-lg shadow-black/20"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    Concevoir ma planche
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* ── Bottom visuals — inside the gradient ── */}
            <div className="relative w-full z-[2] shrink-0 pb-4 sm:pb-6 md:pb-8">
              <div className="max-w-5xl mx-auto px-3 sm:px-6">
                <FadeIn delay={0.5}>
                  <div className="relative flex items-end justify-center gap-3 sm:gap-4 md:gap-8 pb-0">

                      {/* Left — DTF au Mètre */}
                      <motion.div
                        initial={{ y: 80, opacity: 0, rotate: -4 }}
                        animate={{ y: 0, opacity: 1, rotate: -4 }}
                        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                      className="hidden sm:block w-40 md:w-48 -mb-16 relative z-[1]"
                    >
                      <div className="rounded-2xl bg-white shadow-lg shadow-black/10 border border-gray-100 p-3 pb-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center">
                            <Ruler size={10} className="text-gray-400" />
                          </div>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Au Mètre</span>
                        </div>
                        <div style={{ height: "200px" }}>
                          <PlancheMetre />
                        </div>
                      </div>
                    </motion.div>

                    {/* Center — Planche Config */}
                    <motion.div
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.45, duration: 0.8, ease: "easeOut" }}
                      className="w-44 sm:w-60 md:w-68 lg:w-76 -mb-16 sm:-mb-24 relative z-[3]"
                    >
                      <div className="rounded-2xl bg-white shadow-xl shadow-black/12 border border-gray-100 p-4 pb-0 overflow-hidden">
                        {/* Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white shadow-md rounded-full border border-gray-100 text-[10px] font-bold text-gray-600">
                            ✦ Configurateur
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-1 mt-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Planche DTF</span>
                          <span className="text-[9px] text-gray-300">300 dpi</span>
                        </div>
                        <div style={{ height: "180px" }} className="sm:hidden">
                          <PlancheConfig />
                        </div>
                        <div style={{ height: "260px" }} className="hidden sm:block">
                          <PlancheConfig />
                        </div>
                      </div>
                    </motion.div>

                    {/* Right — DTF au Logo */}
                    <motion.div
                      initial={{ y: 80, opacity: 0, rotate: 4 }}
                      animate={{ y: 0, opacity: 1, rotate: 4 }}
                      transition={{ delay: 0.65, duration: 0.8, ease: "easeOut" }}
                      className="hidden sm:block w-40 md:w-48 -mb-16 relative z-[1]"
                    >
                      <div className="rounded-2xl bg-white shadow-lg shadow-black/10 border border-gray-100 p-3 pb-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center">
                            <ImageIcon size={10} className="text-gray-400" />
                          </div>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Au Logo</span>
                        </div>
                        <div style={{ height: "200px" }}>
                          <PlancheLogo />
                        </div>
                      </div>
                    </motion.div>

                  </div>
                </FadeIn>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section id="products" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <FadeIn>
          <h2 className="text-center text-sm font-semibold text-muted uppercase tracking-widest mb-2">
            Nos produits
          </h2>
          <p className="text-center text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-10 sm:mb-14">
            Choisissez votre type de transfert
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn delay={0.1}>
            <Link href="/configure/metre" className="group block">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="card p-5 sm:p-8 h-full rounded-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mb-5">
                  <Ruler size={22} strokeWidth={1.5} className="text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-2">
                  DTF au Mètre
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  Imprimez en continu sur rouleau. Idéal pour les séries et grandes
                  quantités. Prix dégressif dès 1 mètre.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:gap-3 transition-all">
                  Configurer
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </motion.div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Link href="/configure/builder" className="group block">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="card p-5 sm:p-8 h-full rounded-2xl relative overflow-hidden"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    Nouveau
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-5">
                  <LayoutPanelTop size={22} strokeWidth={1.5} className="text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-2">
                  Concevoir ma planche
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  Placez vos visuels sur un rouleau DTF avec notre éditeur.
                  Le métrage est calculé automatiquement.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all">
                  Ouvrir l&apos;éditeur
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </motion.div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Link href="/configure/logo" className="group block">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="card p-5 sm:p-8 h-full rounded-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mb-5">
                  <ImageIcon size={22} strokeWidth={1.5} className="text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-2">
                  DTF au Logo
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  Transferts découpés à la forme. Choisissez votre taille
                  et quantité. Parfait pour la personnalisation.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:gap-3 transition-all">
                  Configurer
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </motion.div>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-t border-border bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <FadeIn delay={0.1}>
              <div>
                <p className="text-3xl font-bold tracking-tight mb-1">48 h</p>
                <p className="text-sm text-muted">Délai de production</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div>
                <p className="text-3xl font-bold tracking-tight mb-1">300 dpi</p>
                <p className="text-sm text-muted">Résolution d&apos;impression</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div>
                <p className="text-3xl font-bold tracking-tight mb-1">-40 %</p>
                <p className="text-sm text-muted">Jusqu&apos;à -40 % en volume</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <FadeIn>
          <div className="rounded-2xl bg-foreground p-6 sm:p-10 md:p-16 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-3 sm:mb-4">
              Prêt à lancer votre commande ?
            </h2>
            <p className="text-white/70 text-base mb-8 max-w-md mx-auto">
              Configurez votre transfert DTF en quelques clics — lancement de l'impression en 24 h garanti.
            </p>
            <Link
              href="/configure/metre"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-foreground font-semibold rounded-full hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Commander maintenant
              <ArrowRight size={18} />
            </Link>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
