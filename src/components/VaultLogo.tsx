"use client";

import { useId } from "react";
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
    sm: { outer: 28, stroke: 1.4 },
    md: { outer: 40, stroke: 1.6 },
    lg: { outer: 56, stroke: 2 },
    xl: { outer: 80, stroke: 2.3 },
  };

  const colors = {
    amber: {
      border: "#d4a26a",
      glow: "rgba(212,162,106,0.18)",
      face: "rgba(22, 18, 14, 0.88)",
      accent: "#f5d4a2",
      sweep: "rgba(245, 212, 162, 0.65)",
    },
    teal: {
      border: "#5eead4",
      glow: "rgba(94,234,212,0.2)",
      face: "rgba(9, 20, 20, 0.88)",
      accent: "#99f6e4",
      sweep: "rgba(153, 246, 228, 0.65)",
    },
    purple: {
      border: "#c084fc",
      glow: "rgba(192,132,252,0.2)",
      face: "rgba(23, 15, 34, 0.9)",
      accent: "#e3c4ff",
      sweep: "rgba(227, 196, 255, 0.7)",
    },
  };

  const s = sizes[size];
  const c = colors[theme];
  const uid = useId().replace(/:/g, "");
  const faceId = `vault-face-${uid}`;
  const sweepId = `vault-sweep-${uid}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: s.outer, height: s.outer }}>
      {animate && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: s.outer * 1.9,
            height: s.outer * 1.9,
            background: `radial-gradient(circle, ${c.glow} 0%, transparent 72%)`,
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <svg width={s.outer} height={s.outer} viewBox="0 0 100 100" className="relative z-10">
        <defs>
          <linearGradient id={faceId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.face} />
            <stop offset="100%" stopColor="rgba(10,10,12,0.94)" />
          </linearGradient>
          <linearGradient id={sweepId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={c.sweep} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <motion.path
          d="M50 8L84 24V48C84 68 69 84 50 92C31 84 16 68 16 48V24L50 8Z"
          fill={`url(#${faceId})`}
          stroke={c.border}
          strokeWidth={s.stroke}
          animate={animate ? { y: [0, -0.8, 0] } : {}}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.path
          d="M50 8L84 24V48C84 68 69 84 50 92C31 84 16 68 16 48V24L50 8Z"
          fill="none"
          stroke={`url(#${sweepId})`}
          strokeWidth={s.stroke + 1}
          animate={animate ? { strokeDasharray: ["12 180", "88 180"], strokeDashoffset: [180, 0] } : {}}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          opacity={0.9}
        />

        <motion.path
          d="M33 39L47.5 62L68 33"
          fill="none"
          stroke={c.accent}
          strokeWidth={s.stroke + 1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={animate ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
