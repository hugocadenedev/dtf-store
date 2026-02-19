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
      <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
        <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem]" style={{ minHeight: "calc(100vh - 3rem)" }}>
          <Particles count={30} />

          <div className="relative z-10 flex items-center justify-center px-4 py-20" style={{ minHeight: "calc(100vh - 3rem)" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
          {/* Card */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={22} className="text-foreground/70" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
              <p className="text-sm text-muted mt-2">
                Accédez à votre espace client
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
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
            <div className="mt-6 text-center">
              <p className="text-sm text-muted">
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
