"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  Upload,
  Trash2,
  ImageIcon,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { LogoEntry } from "./types";
import { getDPI } from "./types";

interface LogoDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (logos: LogoEntry[], spacing: number) => void;
  boardWidth: number;
}

export function LogoDialog({ open, onClose, onConfirm, boardWidth }: LogoDialogProps) {
  const [logos, setLogos] = useState<LogoEntry[]>([]);
  const [spacing, setSpacing] = useState(0.5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const img = new window.Image();
          img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            // Default size: fit within 8cm wide
            const defaultW = Math.min(8, boardWidth - 1);
            const defaultH = defaultW / aspect;

            const entry: LogoEntry = {
              id: `logo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              src: dataUrl,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              fileName: file.name,
              widthCm: parseFloat(defaultW.toFixed(1)),
              heightCm: parseFloat(defaultH.toFixed(1)),
              quantity: 1,
            };
            setLogos((prev) => [...prev, entry]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    [boardWidth]
  );

  const updateLogo = useCallback((id: string, updates: Partial<LogoEntry>) => {
    setLogos((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        // Keep aspect ratio when width changes
        if (updates.widthCm !== undefined && !updates.heightCm) {
          const aspect = l.naturalWidth / l.naturalHeight;
          updated.heightCm = parseFloat((updates.widthCm / aspect).toFixed(1));
        }
        // Keep aspect ratio when height changes
        if (updates.heightCm !== undefined && !updates.widthCm) {
          const aspect = l.naturalWidth / l.naturalHeight;
          updated.widthCm = parseFloat((updates.heightCm * aspect).toFixed(1));
        }
        return updated;
      })
    );
  }, []);

  const removeLogo = useCallback((id: string) => {
    setLogos((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleConfirm = useCallback(() => {
    if (logos.length === 0) return;
    onConfirm(logos, spacing);
    setLogos([]);
    setSpacing(0.5);
  }, [logos, spacing, onConfirm]);

  const handleClose = useCallback(() => {
    setLogos([]);
    setSpacing(0.5);
    onClose();
  }, [onClose]);

  const totalLogos = logos.reduce((sum, l) => sum + l.quantity, 0);

  // Calculate DPI for a given logo entry
  const getLogoDPI = (logo: LogoEntry): number => {
    const dpiX = (logo.naturalWidth * 2.54) / logo.widthCm;
    const dpiY = (logo.naturalHeight * 2.54) / logo.heightCm;
    return Math.round(Math.min(dpiX, dpiY));
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ajouter des logos</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Importez vos logos, choisissez la taille et la quantité
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Upload zone */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-2xl p-6 flex flex-col items-center gap-2 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Upload size={20} className="text-blue-500" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cliquez pour ajouter un logo</span>
                <span className="text-xs text-gray-400">PNG, JPG, SVG — Plusieurs fichiers possibles</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />

              {/* Spacing control */}
              {logos.length > 0 && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8l4 4-4 4"/><path d="M3 12h18"/><path d="M7 8L3 12l4 4"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider">
                      Espacement entre logos
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={spacing}
                        onChange={(e) => setSpacing(Math.max(0, parseFloat(e.target.value) || 0))}
                        step={0.1}
                        min={0}
                        max={10}
                        className="w-20 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-blue-600 font-medium">cm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Logo list */}
              {logos.length > 0 && (
                <div className="space-y-3">
                  {logos.map((logo) => {
                    const dpi = getLogoDPI(logo);
                    const dpiOk = dpi >= 300;
                    const dpiWarn = dpi >= 150 && dpi < 300;

                    return (
                      <div
                        key={logo.id}
                        className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                      >
                        <div className="flex gap-4">
                          {/* Preview */}
                          <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logo.src}
                              alt={logo.fileName}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{logo.fileName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {logo.naturalWidth} × {logo.naturalHeight} px
                                </p>
                              </div>
                              <button
                                onClick={() => removeLogo(logo.id)}
                                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                              >
                                <Trash2 size={13} className="text-red-500" />
                              </button>
                            </div>

                            {/* Size + Quantity controls */}
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              {/* Width */}
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                  Largeur (cm)
                                </label>
                                <input
                                  type="number"
                                  value={logo.widthCm}
                                  onChange={(e) =>
                                    updateLogo(logo.id, {
                                      widthCm: Math.max(0.5, parseFloat(e.target.value) || 0.5),
                                    })
                                  }
                                  step={0.5}
                                  min={0.5}
                                  max={boardWidth - 1}
                                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              {/* Height */}
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                  Hauteur (cm)
                                </label>
                                <input
                                  type="number"
                                  value={logo.heightCm}
                                  onChange={(e) =>
                                    updateLogo(logo.id, {
                                      heightCm: Math.max(0.5, parseFloat(e.target.value) || 0.5),
                                    })
                                  }
                                  step={0.5}
                                  min={0.5}
                                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              {/* Quantity */}
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                  Quantité
                                </label>
                                <div className="flex items-center mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  <button
                                    onClick={() =>
                                      updateLogo(logo.id, { quantity: Math.max(1, logo.quantity - 1) })
                                    }
                                    className="px-2 py-1.5 hover:bg-gray-50 transition-colors"
                                  >
                                    <Minus size={12} className="text-gray-500" />
                                  </button>
                                  <input
                                    type="number"
                                    value={logo.quantity}
                                    onChange={(e) =>
                                      updateLogo(logo.id, {
                                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                                      })
                                    }
                                    min={1}
                                    className="w-full text-center text-sm font-bold bg-transparent border-x border-gray-200 py-1.5 outline-none text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    onClick={() => updateLogo(logo.id, { quantity: logo.quantity + 1 })}
                                    className="px-2 py-1.5 hover:bg-gray-50 transition-colors"
                                  >
                                    <Plus size={12} className="text-gray-500" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* DPI indicator */}
                            <div className="mt-2 flex items-center gap-1.5">
                              {dpiOk ? (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <Check size={11} /> {dpi} DPI — Excellente qualité
                                </span>
                              ) : dpiWarn ? (
                                <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                                  <AlertTriangle size={11} /> {dpi} DPI — Qualité acceptable
                                </span>
                              ) : (
                                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                  <AlertTriangle size={11} /> {dpi} DPI — Qualité insuffisante, réduisez la taille
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {logos.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun logo ajouté</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                {logos.length} logo{logos.length !== 1 ? "s" : ""} • {totalLogos} exemplaire{totalLogos !== 1 ? "s" : ""} au total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={logos.length === 0}
                  className="px-5 py-2.5 text-sm font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check size={14} /> Placer sur la planche
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
