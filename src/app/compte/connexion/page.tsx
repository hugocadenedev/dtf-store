"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Particles } from "@/components/animations/Particles";

export default function ConnexionPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.ok) {
      router.push("/compte");
    } else {
      setError(result.error || "Erreur inconnue.");
    }
  };

  return (
    <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem] pt-0">
      <div className="p-3 sm:p-5 md:p-8 pt-5 sm:pt-8">
        <div
          className="hero-gradient relative w-full overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] md:rounded-[2.5rem]"
          style={{ minHeight: "calc(100vh - 2rem)" }}
        >
          <Particles count={30} />

          <div
            className="relative z-10 flex items-center justify-center px-3 sm:px-4 py-16 sm:py-20"
            style={{ minHeight: "calc(100vh - 2rem)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              {/* Card */}
              <div className="glass-strong rounded-2xl sm:rounded-3xl px-5 py-7 sm:p-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Lock size={20} className="text-foreground/70" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Connexion
                  </h1>
                  <p className="text-xs sm:text-sm text-muted mt-1.5 sm:mt-2">
                    Accédez à votre espace client
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 sm:mb-6 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 sm:mb-2 block">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@email.com"
                        style={{ paddingLeft: "2.25rem", paddingRight: "0.75rem", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
                        className="w-full rounded-xl bg-white/80 border border-gray-200 focus:border-foreground focus:ring-2 focus:ring-foreground/10 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 sm:mb-2 block">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                      />
                      <input
                        type={showPwd ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
                        className="w-full rounded-xl bg-white/80 border border-gray-200 focus:border-foreground focus:ring-2 focus:ring-foreground/10 text-sm outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connexion...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Se connecter <ArrowRight size={15} />
                      </span>
                    )}
                  </button>
                </form>

                {/* Register link */}
                <div className="mt-5 sm:mt-6 text-center">
                  <p className="text-xs sm:text-sm text-muted">
                    Pas encore de compte ?{" "}
                    <Link
                      href="/compte/inscription"
                      className="font-semibold text-foreground hover:underline"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
