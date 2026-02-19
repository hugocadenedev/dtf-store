"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Save, AlertTriangle, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/types";

interface TierRow {
  minQty: number;
  maxQty: number;
  unitPrice: number;
  label: string;
}

export default function AdminPricing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editDesc, setEditDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [descMessage, setDescMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New product form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"metre" | "logo">("metre");
  const [newDesc, setNewDesc] = useState("");

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const p = products.find((p) => p.id === selectedId);
    if (p) {
      setTiers(
        p.tiers.map((t) => ({
          minQty: t.minQty,
          maxQty: t.maxQty,
          unitPrice: t.unitPrice,
          label: t.label,
        }))
      );
      setEditDesc(p.description ?? "");
      setDescMessage("");
    }
  }, [selectedId, products]);

  const addTierRow = () => {
    setTiers((prev) => [
      ...prev,
      { minQty: 0, maxQty: 0, unitPrice: 0, label: "" },
    ]);
  };

  const removeTierRow = (idx: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: keyof TierRow, value: string) => {
    setTiers((prev) =>
      prev.map((t, i) =>
        i === idx
          ? {
              ...t,
              [field]:
                field === "label" ? value : parseFloat(value) || 0,
            }
          : t
      )
    );
  };

  const saveDescription = async () => {
    if (!selectedId) return;
    setSavingDesc(true);
    setDescMessage("");
    try {
      await fetch(`/api/products/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...products.find((p) => p.id === selectedId),
          description: editDesc,
        }),
      });
      setDescMessage("Description enregistrée.");
      await loadProducts();
    } catch {
      setDescMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSavingDesc(false);
    }
  };

  const saveTiers = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage("");

    try {
      await fetch("/api/tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: selectedId, tiers }),
      });
      setMessage("Grille tarifaire enregistrée.");
      await loadProducts();
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const createProduct = async () => {
    if (!newName) return;
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: newName,
        type: newType,
        description: newDesc,
      }),
    });
    setNewName("");
    setNewDesc("");
    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        if (selectedId === id) {
          setSelectedId("");
          setTiers([]);
        }
        await loadProducts();
      }
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 shimmer" />
      <div className="h-32 shimmer" />
      <div className="h-64 shimmer" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Produits & Tarifs
      </h1>
      <p className="text-sm text-muted mb-8">
        {products.length} produit{products.length > 1 ? "s" : ""}
      </p>

      {/* Create product */}
      <div className="card p-6 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Nouveau produit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Nom"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value as "metre" | "logo")}>
            <option value="metre">Au Metre</option>
            <option value="logo">Au Logo</option>
          </select>
          <input
            type="text"
            placeholder="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <button onClick={createProduct} className="btn-primary text-xs">
            <Plus size={14} /> Créer
          </button>
        </div>
      </div>

      {/* Product list */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-3">Produits existants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`card p-4 cursor-pointer transition-all ${
                selectedId === p.id
                  ? "ring-2 ring-foreground/20 shadow-md"
                  : "hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                    <Package size={14} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">
                      {p.type === "metre" ? "Au mètre" : "Au logo"}
                      <span className="mx-1">·</span>
                      {p.tiers.length} palier{p.tiers.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(p.id);
                  }}
                  className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {p.description && (
                <p className="text-xs text-muted line-clamp-2 mt-1">{p.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-center text-lg font-bold mb-2">Supprimer ce produit ?</h3>
              <p className="text-center text-sm text-muted mb-5">
                Le produit <strong>{products.find((p) => p.id === deleteConfirm)?.name}</strong> et
                tous ses paliers seront supprimés définitivement.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary flex-1 text-sm"
                  disabled={deleting}
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteProduct(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  {deleting ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description editor */}
      {selectedId && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Description du produit
          </h2>
          <textarea
            rows={6}
            placeholder="Description affichée sur la fiche produit...&#10;&#10;Les retours à la ligne seront conservés."
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full text-sm resize-y"
            style={{ whiteSpace: "pre-wrap" }}
          />
          <div className="flex items-center justify-between mt-3">
            {descMessage && (
              <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">
                {descMessage}
              </p>
            )}
            <button
              onClick={saveDescription}
              disabled={savingDesc}
              className="btn-primary text-xs ml-auto"
            >
              <Save size={14} />
              {savingDesc ? "Enregistrement..." : "Enregistrer la description"}
            </button>
          </div>
        </div>
      )}

      {/* Tier editor */}
      {selectedId && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between bg-foreground/[0.03]">
            <p className="text-xs font-semibold text-foreground">
              Paliers de prix
            </p>
            <button
              onClick={addTierRow}
              className="text-xs flex items-center gap-1 font-semibold text-foreground hover:text-foreground/70 transition-colors"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>

          {/* Header */}
          <div className="grid grid-cols-5 gap-2 px-5 py-2.5 text-xs font-semibold text-muted border-b border-border/60">
            <span>Qte min</span>
            <span>Qte max</span>
            <span>Prix unit. (EUR)</span>
            <span>Label</span>
            <span></span>
          </div>

          {/* Rows */}
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className="grid grid-cols-5 gap-2 px-5 py-2.5 items-center border-b border-border/40 last:border-0 hover:bg-foreground/[0.02] transition-colors"
            >
              <input
                type="number"
                step="0.5"
                value={tier.minQty}
                onChange={(e) => updateTier(idx, "minQty", e.target.value)}
                className="text-sm"
              />
              <input
                type="number"
                step="0.5"
                value={tier.maxQty}
                onChange={(e) => updateTier(idx, "maxQty", e.target.value)}
                className="text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={tier.unitPrice}
                onChange={(e) => updateTier(idx, "unitPrice", e.target.value)}
                className="text-sm"
              />
              <input
                type="text"
                value={tier.label}
                onChange={(e) => updateTier(idx, "label", e.target.value)}
                className="text-sm"
                placeholder="ex: 10x10cm"
              />
              <button
                onClick={() => removeTierRow(idx)}
                className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-red-50 justify-self-center transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="px-5 py-4 border-t border-border/60 flex items-center justify-between">
            {message && (
              <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">{message}</p>
            )}
            <button
              onClick={saveTiers}
              disabled={saving}
              className="btn-primary text-xs ml-auto"
            >
              <Save size={14} />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
