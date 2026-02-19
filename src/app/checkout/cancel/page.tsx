"use client";

import Link from "next/link";
import { XCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CancelPage() {
  return (
    <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
      <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
        <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 pb-12 sm:pb-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-white/80" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-white hero-3d-text">
              Paiement annule
            </h1>
            <p className="text-sm text-white/70 leading-relaxed mb-8 max-w-md mx-auto">
              Le paiement a ete annule. Aucun montant n&apos;a ete debite.
              Vous pouvez reessayer a tout moment.
            </p>
            <Link href="/checkout" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-foreground font-semibold rounded-full hover:bg-white/90 transition-all shadow-lg">
              Retour au panier <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
