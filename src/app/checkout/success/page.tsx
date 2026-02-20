"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "confirmed" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Confirm payment server-side
    fetch(`/api/checkout/confirm?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.paid ? "confirmed" : "error");
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem]">
      <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
        <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 pb-12 sm:pb-16 text-center">
          {status === "loading" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 size={40} className="text-white/80 animate-spin mx-auto mb-6" />
              <p className="text-sm text-white/70">Confirmation du paiement en cours…</p>
            </motion.div>
          ) : status === "confirmed" ? (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-white/80" strokeWidth={1.5} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-white hero-3d-text">
                  Commande confirmée
                </h1>
                <p className="text-sm text-white/70 leading-relaxed mb-8 max-w-md mx-auto">
                  Merci pour votre commande ! Vous recevrez un email de confirmation
                  sous peu. Notre équipe prépare vos transferts DTF.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-foreground font-semibold rounded-full hover:bg-white/90 transition-all shadow-lg">
                  Retour à l&apos;accueil <ArrowRight size={14} />
                </Link>
              </motion.div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-white hero-3d-text">
                Erreur de confirmation
              </h1>
              <p className="text-sm text-white/70 leading-relaxed mb-8 max-w-md mx-auto">
                Nous n&apos;avons pas pu confirmer votre paiement. Si le montant a été débité, contactez-nous.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-foreground font-semibold rounded-full hover:bg-white/90 transition-all shadow-lg">
                Retour à l&apos;accueil <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
