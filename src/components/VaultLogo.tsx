"use client";

import { motion } from "motion/react";

export function VaultLogo({
  size = "md",
  animate = true,
  theme = "amber",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  theme?: "amber" | "teal" | "purple";
}) {
  const sizes = {
    sm: { outer: 28, inner: 10, stroke: 1.5, gap: 5, dot: 2.5 },
    md: { outer: 40, inner: 14, stroke: 1.5, gap: 6, dot: 3 },
    lg: { outer: 56, inner: 20, stroke: 2, gap: 7, dot: 4 },
    xl: { outer: 80, inner: 28, stroke: 2.5, gap: 9, dot: 5 },
  };

  const colors = {
    amber: { ring: "#d4a26a", glow: "rgba(212,162,106,0.15)", accent: "#e8c08a" },
    teal: { ring: "#5eead4", glow: "rgba(94,234,212,0.15)", accent: "#99f6e4" },
    purple: { ring: "#c084fc", glow: "rgba(192,132,252,0.15)", accent: "#d8b4fe" },
  };

  const s = sizes[size];
  const c = colors[theme];
  const center = s.outer / 2;
  const radius = (s.outer - s.stroke * 2) / 2 - s.gap;

  return (
    <div className="relative flex items-center justify-center" style={{ width: s.outer, height: s.outer }}>
      {animate && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: s.outer * 1.8, height: s.outer * 1.8, background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <svg width={s.outer} height={s.outer} viewBox={`0 0 ${s.outer} ${s.outer}`} className="relative z-10">
        <motion.circle
          cx={center} cy={center} r={radius} fill="none" stroke={c.ring} strokeWidth={s.stroke} opacity={0.35}
          strokeDasharray={`${radius * 0.8} ${radius * 1.2}`}
          animate={animate ? { rotate: [0, 360] } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        <motion.circle
          cx={center} cy={center} r={radius + s.gap} fill="none" stroke={c.ring} strokeWidth={s.stroke * 0.5} opacity={0.15}
          animate={animate ? { rotate: [0, -360] } : {}}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        <motion.circle
          cx={center} cy={center} r={s.inner} fill="none" stroke={c.ring} strokeWidth={s.stroke} opacity={0.6}
          animate={animate ? { scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        />
        <motion.circle
          cx={center} cy={center} r={s.dot} fill={c.accent}
          animate={animate ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </div>
  );
}
