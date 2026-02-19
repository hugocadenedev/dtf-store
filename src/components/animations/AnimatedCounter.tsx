"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(value);

  // Extract numeric part for animation
  const numericMatch = value.match(/^([−-]?)(\d+)/);
  const prefix = value.match(/^[^0-9−-]*/)?.[0] || "";
  const sign = numericMatch?.[1] || "";
  const numericValue = numericMatch ? parseInt(numericMatch[2]) : 0;
  const suffix = numericMatch
    ? value.slice((prefix + sign + numericMatch[2]).length)
    : value;

  useEffect(() => {
    if (!isInView || numericValue === 0) {
      setDisplayed(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 1500;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * end);
      setDisplayed(`${prefix}${sign}${start}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayed(value);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, numericValue, prefix, sign, suffix, value]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {displayed}
    </motion.span>
  );
}
