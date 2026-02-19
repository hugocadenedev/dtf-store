"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DeliveryPickerProps {
  value: string; // ISO date string or ""
  onChange: (date: string, label: string) => void;
  variant?: "light" | "dark";
}

/** Add business days (skip Sat/Sun) */
function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/** Format a date as "Lun 21 fév" */
function formatShort(d: Date): string {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "jan", "fév", "mar", "avr", "mai", "jun",
    "jul", "aoû", "sep", "oct", "nov", "déc",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAY_HEADERS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function DeliveryPicker({ value, onChange, variant = "dark" }: DeliveryPickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const today = useMemo(() => new Date(), []);

  // Minimum selectable date = +48h from now
  const minDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);

  // Quick options
  const quickOptions = useMemo(() => {
    return [2, 3, 4, 5].map((days) => {
      const d = addBusinessDays(today, days);
      return {
        days,
        date: d,
        iso: toISO(d),
        label: `${days} jours ouvrés`,
        formatted: formatShort(d),
      };
    });
  }, [today]);

  const isLight = variant === "light";

  // Calendar grid
  const calendarDays = useMemo(() => {
    const { year, month } = calMonth;
    const first = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    // Monday = 0
    let startDow = first.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calMonth]);

  const canGoPrev =
    calMonth.year > today.getFullYear() ||
    (calMonth.year === today.getFullYear() && calMonth.month > today.getMonth());

  const handleQuickSelect = (opt: (typeof quickOptions)[0]) => {
    onChange(opt.iso, opt.label);
    setShowCalendar(false);
  };

  const handleDateSelect = (d: Date) => {
    if (d < minDate) return;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return;
    onChange(toISO(d), formatShort(d));
    setShowCalendar(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Truck size={14} className={isLight ? "text-foreground/50" : "text-white/60"} />
        <span className={`text-xs font-semibold ${isLight ? "text-foreground/50" : "text-white/60"}`}>
          Délai de livraison
        </span>
      </div>

      {/* Quick options */}
      <div className="grid grid-cols-2 gap-2">
        {quickOptions.map((opt) => {
          const isSelected = value === opt.iso;
          return (
            <motion.button
              key={opt.days}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickSelect(opt)}
              className={`relative py-3 px-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? "border-foreground bg-foreground text-white shadow-lg"
                  : isLight
                  ? "border-border bg-white hover:border-foreground/30 text-foreground"
                  : "border-white/20 hover:border-white/40 text-white"
              }`}
            >
              <span className="block text-xs font-bold">{opt.label}</span>
              <span
                className={`block text-[10px] mt-0.5 ${
                  isSelected ? "text-white/70" : isLight ? "text-muted" : "text-white/50"
                }`}
              >
                {opt.formatted}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="delivery-check"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Custom date trigger */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full py-3 px-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
          showCalendar || (value && !quickOptions.find((o) => o.iso === value))
            ? "border-foreground bg-foreground text-white"
            : isLight
            ? "border-border bg-white hover:border-foreground/30 text-foreground"
            : "border-white/20 hover:border-white/40 text-white"
        }`}
      >
        <Calendar size={16} className="shrink-0 opacity-60" />
        <div>
          <span className="block text-xs font-bold">Choisir une date</span>
          {value && !quickOptions.find((o) => o.iso === value) && (
            <span className="block text-[10px] mt-0.5 opacity-70">
              {formatShort(new Date(value + "T00:00:00"))}
            </span>
          )}
        </div>
      </motion.button>

      {/* Calendar dropdown */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className={`rounded-2xl border p-4 ${
                isLight
                  ? "bg-white border-border shadow-lg shadow-black/5"
                  : "bg-white/10 border-white/20 backdrop-blur-xl"
              }`}
            >
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setCalMonth((prev) => {
                      const m = prev.month - 1;
                      return m < 0
                        ? { year: prev.year - 1, month: 11 }
                        : { year: prev.year, month: m };
                    })
                  }
                  disabled={!canGoPrev}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canGoPrev
                      ? isLight
                        ? "hover:bg-foreground/5 text-foreground"
                        : "hover:bg-white/10 text-white"
                      : "opacity-20 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <span
                  className={`text-sm font-bold ${isLight ? "text-foreground" : "text-white"}`}
                >
                  {MONTH_NAMES[calMonth.month]} {calMonth.year}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCalMonth((prev) => {
                      const m = prev.month + 1;
                      return m > 11
                        ? { year: prev.year + 1, month: 0 }
                        : { year: prev.year, month: m };
                    })
                  }
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLight
                      ? "hover:bg-foreground/5 text-foreground"
                      : "hover:bg-white/10 text-white"
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_HEADERS.map((d) => (
                  <div
                    key={d}
                    className={`text-center text-[10px] font-bold py-1 ${
                      isLight ? "text-muted" : "text-white/40"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} />;
                  }

                  const iso = toISO(day);
                  const isSelected = value === iso;
                  const dow = day.getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  const isPast = day < minDate;
                  const isDisabled = isPast || isWeekend;

                  return (
                    <motion.button
                      key={iso}
                      type="button"
                      whileHover={!isDisabled ? { scale: 1.15 } : {}}
                      whileTap={!isDisabled ? { scale: 0.9 } : {}}
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      className={`
                        aspect-square rounded-xl text-xs font-semibold transition-all duration-150
                        flex items-center justify-center
                        ${
                          isSelected
                            ? "bg-foreground text-white shadow-md"
                            : isDisabled
                            ? isLight
                              ? "text-foreground/15 cursor-not-allowed"
                              : "text-white/15 cursor-not-allowed"
                            : isLight
                            ? "text-foreground hover:bg-foreground/10"
                            : "text-white hover:bg-white/15"
                        }
                      `}
                    >
                      {day.getDate()}
                    </motion.button>
                  );
                })}
              </div>

              <p
                className={`text-[10px] mt-3 text-center ${
                  isLight ? "text-muted" : "text-white/40"
                }`}
              >
                Dates disponibles à partir du {formatShort(minDate)} · Jours ouvrés uniquement
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
