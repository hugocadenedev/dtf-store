"use client";

import type { PriceTier } from "@/lib/pricing";
import { formatPrice } from "@/lib/pricing";
import { motion } from "framer-motion";

interface PriceTableProps {
  tiers: PriceTier[];
  currentQty: number;
  unit: string; // "m" or "pcs"
}

export function PriceTable({ tiers, currentQty, unit }: PriceTableProps) {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 bg-foreground/[0.03]">
        <p className="text-xs font-semibold text-foreground">
          Grille tarifaire
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left">
            <th className="px-5 py-3 font-medium text-muted text-xs">
              Quantite
            </th>
            <th className="px-5 py-3 font-medium text-muted text-xs text-right">
              Prix / {unit}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tier, i) => {
            const isActive =
              currentQty >= tier.minQty && currentQty <= tier.maxQty;
            return (
              <motion.tr
                key={tier.id}
                initial={false}
                animate={{
                  backgroundColor: isActive
                    ? "var(--accent-light)"
                    : "transparent",
                }}
                transition={{ duration: 0.25 }}
                className="border-b border-border/40 last:border-0"
              >
                <td className={`px-5 py-3 ${isActive ? "text-foreground font-semibold" : ""}`}>
                  {tier.label
                    ? tier.label
                    : tier.maxQty >= 99999
                    ? `${tier.minQty}${unit}+`
                    : `${tier.minQty} - ${tier.maxQty}${unit}`}
                </td>
                <td className={`px-5 py-3 text-right font-medium ${isActive ? "text-foreground font-semibold" : ""}`}>
                  {formatPrice(tier.unitPrice)}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
