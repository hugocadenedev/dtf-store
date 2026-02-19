"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { BuilderObject, Tool, CanvasHandle, LogoEntry } from "./types";
import { getObjectBounds, getDPI, autoLayoutLogos } from "./types";
import type { PriceTier } from "@/lib/pricing";
import { getUnitPrice, calculateTotal, formatPrice } from "@/lib/pricing";
import { LogoDialog } from "./LogoDialog";
import { generateBoardPdf } from "@/lib/pdfExport";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer2,
  Type,
  ImageIcon,
  Square,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Settings2,
  Check,
  LayoutPanelTop,
  Layers,
} from "lucide-react";

/* Dynamic import — Konva needs window */
const BuilderCanvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
      Chargement du canvas…
    </div>
  ),
});

/* ═══════════════════════════════════════════════════════════════ */
/*  Toolbar button                                                */
/* ═══════════════════════════════════════════════════════════════ */
function TBtn({
  icon,
  label,
  active,
  onClick,
  disabled,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
        active
          ? "bg-white/25 text-white shadow-inner"
          : accent
          ? "bg-red-500/80 text-white hover:bg-red-500"
          : "text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Props                                                         */
/* ═══════════════════════════════════════════════════════════════ */
interface BuilderModalProps {
  open: boolean;
  tiers: PriceTier[];
  onClose: () => void;
  onConfirm: (file: File, metrage: number) => void;
}

const BOARD_WIDTH = 60;

export function BuilderModal({ open, tiers, onClose, onConfirm }: BuilderModalProps) {
  /* ─── builder state ─── */
  const [objects, setObjects] = useState<BuilderObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boardHeight, setBoardHeight] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [fillColor, setFillColor] = useState("#000000");
  const [quantity, setQuantity] = useState(1);

  const canvasRef = useRef<CanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setObjects([]);
      setSelectedId(null);
      setBoardHeight(100);
      setZoom(100);
      setActiveTool("select");
      setFillColor("#000000");
      setQuantity(1);
    }
  }, [open]);

  /* ─── selected object ─── */
  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId]
  );

  /* ─── callbacks ─── */
  const updateObject = useCallback(
    (id: string, u: Partial<BuilderObject>) => {
      setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...u } : o)));
    },
    []
  );

  const addObject = useCallback((obj: BuilderObject) => {
    setObjects((prev) => [...prev, obj]);
    setSelectedId(obj.id);
    setActiveTool("select");
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const obj = objects.find((o) => o.id === selectedId);
    if (!obj) return;
    const dup: BuilderObject = {
      ...obj,
      id: `${obj.type}-${Date.now()}`,
      x: obj.x + 1,
      y: obj.y + 1,
    };
    setObjects((prev) => [...prev, dup]);
    setSelectedId(dup.id);
  }, [selectedId, objects]);

  const resetBoard = useCallback(() => {
    setObjects([]);
    setSelectedId(null);
    setBoardHeight(100);
    setZoom(100);
  }, []);

  /* ─── image upload ─── */
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const maxSize = 15;
          const aspect = img.naturalWidth / img.naturalHeight;
          let w: number, h: number;
          if (aspect > 1) {
            w = maxSize;
            h = maxSize / aspect;
          } else {
            h = maxSize;
            w = maxSize * aspect;
          }
          addObject({
            id: `img-${Date.now()}`,
            type: "image",
            x: (BOARD_WIDTH - w) / 2,
            y: Math.max(0, 5),
            width: w,
            height: h,
            rotation: 0,
            src: dataUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [addObject]
  );

  /* ─── logo dialog: place logos with auto-layout ─── */
  const handleLogosConfirm = useCallback(
    (logos: LogoEntry[]) => {
      const { objects: newObjs, newBoardHeight } = autoLayoutLogos(logos, BOARD_WIDTH, objects);
      setObjects((prev) => [...prev, ...newObjs]);
      setBoardHeight((h) => Math.max(h, newBoardHeight));
      setSelectedId(null);
      setActiveTool("select");
      setLogoDialogOpen(false);
    },
    [objects]
  );

  /* ─── keyboard shortcuts ─── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      if (e.key === "Escape") {
        if (selectedId) {
          setSelectedId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, deleteSelected, duplicateSelected, selectedId, onClose]);

  /* ─── auto-extend board ─── */
  useEffect(() => {
    if (objects.length === 0) return;
    let maxBottom = 0;
    for (const obj of objects) {
      maxBottom = Math.max(maxBottom, getObjectBounds(obj).maxY);
    }
    if (maxBottom > boardHeight - 5) {
      setBoardHeight(Math.ceil(maxBottom / 25) * 25 + 25);
    }
  }, [objects, boardHeight]);

  /* ─── computed stats ─── */
  const metrageUsed = useMemo(() => {
    if (objects.length === 0) return 0;
    let maxY = 0;
    for (const obj of objects) {
      maxY = Math.max(maxY, getObjectBounds(obj).maxY);
    }
    return Math.ceil(maxY) / 100;
  }, [objects]);

  const totalSurface = useMemo(
    () => Math.round(objects.reduce((s, o) => s + o.width * o.height, 0)),
    [objects]
  );

  // Rule: min 1m per board, always round up to whole meters
  const metragePerBoard = metrageUsed > 0 ? Math.max(1, Math.ceil(metrageUsed)) : 0;
  const metrageGlobal = metragePerBoard * quantity;
  const unitPrice = getUnitPrice(tiers, metrageGlobal);
  const totalPrice = calculateTotal(tiers, metrageGlobal);

  /* ─── confirm → build vector PDF from objects (full-res logos) ─── */
  const handleConfirm = useCallback(async () => {
    if (objects.length === 0) return;
    try {
      const pdfBytes = await generateBoardPdf(objects, BOARD_WIDTH, boardHeight);
      const file = new File(
        [pdfBytes.buffer as ArrayBuffer],
        "planche-dtf.pdf",
        { type: "application/pdf" }
      );
      onConfirm(file, metrageGlobal);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Erreur lors de la génération du PDF");
    }
  }, [objects, metrageGlobal, onConfirm, boardHeight]);

  if (!open) return null;

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                        */
  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col"
        >
          {/* Backdrop + gradient fill */}
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 bg-black/20" />

          {/* ────── Title bar ────── */}
          <div className="relative z-10 flex items-center justify-between px-5 h-14 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <LayoutPanelTop size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">Créer ma planche</h1>
                <p className="text-[10px] text-white/50">Éditeur de planche DTF</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-colors"
              title="Fermer"
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* ────── Toolbar ────── */}
          <div className="relative z-10 flex items-center gap-1 px-4 h-11 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1 glass rounded-xl px-2 py-1" style={{ color: "white" }}>
              <TBtn icon={<MousePointer2 size={13} />} label="Sélection" active={activeTool === "select"} onClick={() => setActiveTool("select")} />
              <TBtn icon={<Type size={13} />} label="Texte" active={activeTool === "text"} onClick={() => setActiveTool("text")} />
              <TBtn icon={<ImageIcon size={13} />} label="Image" onClick={() => fileInputRef.current?.click()} />
              <TBtn icon={<Layers size={13} />} label="Logos" onClick={() => setLogoDialogOpen(true)} />
              <TBtn icon={<Square size={13} />} label="Forme" active={activeTool === "shape"} onClick={() => setActiveTool("shape")} />

              <div className="mx-1 h-5 w-px bg-white/20 shrink-0" />

              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-white/30 bg-transparent shrink-0"
              />
            </div>

            <div className="flex items-center gap-1 glass rounded-xl px-2 py-1 ml-2" style={{ color: "white" }}>
              <TBtn icon={<Copy size={13} />} label="Dupliquer" onClick={duplicateSelected} disabled={!selectedId} />
              <TBtn icon={<Trash2 size={13} />} label="Supprimer" onClick={deleteSelected} disabled={!selectedId} accent={!!selectedId} />
            </div>

            <div className="flex items-center gap-1 glass rounded-xl px-2 py-1 ml-2" style={{ color: "white" }}>
              <TBtn icon={<ZoomOut size={13} />} label="" onClick={() => setZoom((z) => Math.max(25, z - 10))} />
              <span className="text-[11px] text-white/80 w-10 text-center tabular-nums shrink-0">{zoom}%</span>
              <TBtn icon={<ZoomIn size={13} />} label="" onClick={() => setZoom((z) => Math.min(300, z + 10))} />
            </div>

            <div className="ml-auto">
              <button
                onClick={resetBoard}
                className="text-[10px] px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg font-medium transition-colors backdrop-blur shrink-0"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* ────── Main area ────── */}
          <div className="relative z-10 flex flex-1 min-h-0 px-4 pb-4 gap-3 mt-2">
            {/* Left sidebar — glass */}
            <div className="w-52 glass rounded-2xl flex flex-col shrink-0 overflow-y-auto" style={{ color: "#1a2a3a" }}>
              {/* Stats */}
              <div className="p-4">
                <h3 className="text-[11px] font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                  <BarChart3 size={12} /> Statistiques
                </h3>
                <div className="space-y-2.5">
                  <div className="bg-white/40 rounded-xl px-3 py-2.5 border border-white/50">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Métrage utilisé</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{metragePerBoard} m</p>
                    {metrageUsed > 0 && metrageUsed !== metragePerBoard && (
                      <p className="text-[9px] text-slate-400 mt-0.5">({metrageUsed.toFixed(2)} m utilisé)</p>
                    )}
                  </div>
                  <div className="bg-white/40 rounded-xl px-3 py-2.5 border border-white/50">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Surface totale</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{totalSurface.toLocaleString("fr-FR")} cm²</p>
                  </div>
                  <div className="bg-white/40 rounded-xl px-3 py-2.5 border border-white/50">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Objets</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{objects.length}</p>
                  </div>
                </div>
              </div>

              {/* Properties */}
              {selectedObj && (
                <div className="p-4 border-t border-white/30">
                  <h3 className="text-[11px] font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                    <Settings2 size={12} /> Propriétés
                  </h3>
                  <div className="space-y-2.5">
                    {selectedObj.type === "text" && (
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase tracking-wider">Texte</label>
                        <input
                          type="text"
                          value={selectedObj.text || ""}
                          onChange={(e) => updateObject(selectedId!, { text: e.target.value })}
                          className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase tracking-wider">Largeur (cm)</label>
                      <input
                        type="number"
                        value={parseFloat(selectedObj.width.toFixed(1))}
                        onChange={(e) => updateObject(selectedId!, { width: Math.max(0.5, parseFloat(e.target.value) || 0.5) })}
                        step={0.1}
                        className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase tracking-wider">Hauteur (cm)</label>
                      <input
                        type="number"
                        value={parseFloat(selectedObj.height.toFixed(1))}
                        onChange={(e) => updateObject(selectedId!, { height: Math.max(0.5, parseFloat(e.target.value) || 0.5) })}
                        step={0.1}
                        className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase tracking-wider">Rotation (°)</label>
                      <input
                        type="number"
                        value={Math.round(selectedObj.rotation)}
                        onChange={(e) => updateObject(selectedId!, { rotation: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-2 py-1.5 !bg-white/50 !border-white/60 !text-slate-800 rounded-lg text-xs outline-none focus:!border-slate-400"
                      />
                    </div>
                    {selectedObj.type === "image" && selectedObj.naturalWidth != null && (
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase tracking-wider">DPI</label>
                        <p className={`text-sm font-bold mt-0.5 ${
                          getDPI(selectedObj) >= 300 ? "text-green-600" : getDPI(selectedObj) >= 150 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {getDPI(selectedObj)} {getDPI(selectedObj) >= 300 ? "✓" : "⚠️"}
                        </p>
                      </div>
                    )}
                    {selectedObj.fill !== undefined && (
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase tracking-wider">Couleur</label>
                        <input
                          type="color"
                          value={selectedObj.fill || "#000000"}
                          onChange={(e) => updateObject(selectedId!, { fill: e.target.value })}
                          className="w-full mt-1 h-8 rounded-lg cursor-pointer border border-white/50 bg-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative min-w-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
              <BuilderCanvas
                ref={canvasRef}
                boardWidth={BOARD_WIDTH}
                boardHeight={boardHeight}
                objects={objects}
                selectedId={selectedId}
                zoom={zoom}
                activeTool={activeTool}
                fillColor={fillColor}
                onSelect={setSelectedId}
                onUpdateObject={updateObject}
                onAddObject={addObject}
              />

              {/* Extend / Reduce */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                <button
                  onClick={() =>
                    setBoardHeight((h) => {
                      let maxY = 25;
                      for (const o of objects) {
                        maxY = Math.max(maxY, getObjectBounds(o).maxY + 5);
                      }
                      return Math.max(Math.ceil(maxY / 25) * 25, h - 25);
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl text-xs font-medium text-slate-700 transition-colors"
                >
                  <ChevronUp size={14} /> Réduire
                </button>
                <button
                  onClick={() => setBoardHeight((h) => h + 25)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/30 hover:bg-white/40 backdrop-blur border border-white/40 rounded-xl text-xs font-medium text-white transition-colors"
                >
                  <ChevronDown size={14} /> Étendre
                </button>
              </div>
            </div>

            {/* Right sidebar — Price/Quantity */}
            <div className="w-52 glass-strong rounded-2xl flex flex-col shrink-0 overflow-hidden" style={{ color: "#1a2a3a" }}>
              <div className="p-4 flex-1">
                <h3 className="text-[11px] font-semibold text-slate-600 mb-4 uppercase tracking-wider">Récapitulatif</h3>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider">Nb. planches</label>
                  <div className="flex items-center mt-1.5 bg-white/50 rounded-xl border border-white/60">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-2.5 py-2 hover:bg-white/40 rounded-l-xl transition-colors">
                      <Minus size={12} className="text-slate-600" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center text-sm font-bold !bg-transparent !border-x !border-white/50 !text-slate-800 py-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={() => setQuantity((q) => q + 1)} className="px-2.5 py-2 hover:bg-white/40 rounded-r-xl transition-colors">
                      <Plus size={12} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Utilisé</span>
                    <span className="text-slate-500">{metrageUsed.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Facturé/planche</span>
                    <span className="font-bold text-slate-800">{metragePerBoard} m</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Métrage total</span>
                    <span className="font-bold text-slate-800">{metrageGlobal} m</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Prix/m</span>
                    <span className="font-bold text-slate-800">{formatPrice(unitPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="px-4 py-4 bg-slate-800/90 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Total HT</span>
                  <span className="text-xl font-bold text-white">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Confirm */}
              <div className="p-3">
                <button
                  onClick={handleConfirm}
                  disabled={objects.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 font-semibold text-sm bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Check size={14} /> Valider la planche
                </button>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Logo placement dialog */}
          <LogoDialog
            open={logoDialogOpen}
            onClose={() => setLogoDialogOpen(false)}
            onConfirm={handleLogosConfirm}
            boardWidth={BOARD_WIDTH}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
