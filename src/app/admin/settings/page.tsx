"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Truck, Percent, Gift, Save, Loader2, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

interface ShopSettings {
  shippingPrice: number;
  freeShippingThreshold: number;
  vatPercent: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la sauvegarde");
      } else {
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-20 text-muted">
        Impossible de charger les paramètres.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
            <Settings size={18} className="text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
            <p className="text-xs text-muted">Livraison, TVA et options générales</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 max-w-2xl">
        {/* Shipping Price */}
        <FadeIn delay={0.05}>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Truck size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Prix de livraison</p>
                <p className="text-[11px] text-muted">Montant facturé pour la livraison standard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                step={0.1}
                value={settings.shippingPrice}
                onChange={(e) => setSettings((s) => s && { ...s, shippingPrice: parseFloat(e.target.value) || 0 })}
                className="flex-1 text-lg font-bold"
              />
              <span className="text-sm font-semibold text-muted">€ HT</span>
            </div>
            <p className="text-[10px] text-muted mt-2">
              3 jours ouvrés de production + 24h de livraison maximum
            </p>
          </div>
        </FadeIn>

        {/* Free Shipping Threshold */}
        <FadeIn delay={0.1}>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Gift size={14} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Livraison offerte à partir de</p>
                <p className="text-[11px] text-muted">Montant HT minimum pour bénéficier de la livraison gratuite</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                step={1}
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings((s) => s && { ...s, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                className="flex-1 text-lg font-bold"
              />
              <span className="text-sm font-semibold text-muted">€ HT</span>
            </div>
            <p className="text-[10px] text-muted mt-2">
              Mettez 0 pour ne jamais offrir la livraison, ou un montant très élevé pour toujours facturer la livraison
            </p>
          </div>
        </FadeIn>

        {/* VAT Percent */}
        <FadeIn delay={0.15}>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Percent size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">TVA</p>
                <p className="text-[11px] text-muted">Pourcentage de TVA appliqué au total</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={settings.vatPercent}
                onChange={(e) => setSettings((s) => s && { ...s, vatPercent: parseFloat(e.target.value) || 0 })}
                className="flex-1 text-lg font-bold"
              />
              <span className="text-sm font-semibold text-muted">%</span>
            </div>
          </div>
        </FadeIn>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 border border-red-200 bg-red-50 rounded-xl px-4 py-2.5"
          >
            {error}
          </motion.p>
        )}

        {/* Save button */}
        <FadeIn delay={0.2}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full text-sm py-3.5 disabled:opacity-40"
          >
            {saving ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <Loader2 size={14} className="animate-spin" /> Sauvegarde…
              </motion.span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} /> Sauvegardé !
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={14} /> Enregistrer les paramètres
              </span>
            )}
          </button>
        </FadeIn>
      </div>
    </div>
  );
}
