import type { CSSProperties } from "react";
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

interface ShardDef {
  left: string;
  top: string;
  size: number;
  clip: string;
  depth: number;
  rotate: number;
  tint: "ice" | "violet" | "accent";
  delay: number;
  className?: string;
}

const SHARDS: ShardDef[] = [
  { left: "6%", top: "16%", size: 210, clip: "polygon(8% 0, 100% 24%, 62% 100%, 0 70%)", depth: 46, rotate: -14, tint: "ice", delay: 0 },
  { left: "78%", top: "10%", size: 260, clip: "polygon(30% 0, 100% 12%, 82% 100%, 0 58%)", depth: 70, rotate: 18, tint: "violet", delay: 1.2 },
  { left: "88%", top: "62%", size: 150, clip: "polygon(50% 0, 100% 78%, 0 100%)", depth: 90, rotate: 8, tint: "accent", delay: 0.6 },
  { left: "-2%", top: "66%", size: 240, clip: "polygon(0 18%, 86% 0, 100% 66%, 28% 100%)", depth: 30, rotate: 22, tint: "accent", delay: 1.8, className: "max-md:hidden" },
  { left: "44%", top: "78%", size: 120, clip: "polygon(0 30%, 70% 0, 100% 80%, 24% 100%)", depth: 110, rotate: -26, tint: "ice", delay: 2.4, className: "max-md:hidden" },
];

const TINT: Record<ShardDef["tint"], string> = {
  ice: "rgba(127,227,255,0.22)",
  violet: "rgba(183,156,255,0.22)",
  accent: "color-mix(in srgb, var(--accent) 30%, transparent)",
};

function Shard({ def, px, py }: { def: ShardDef; px: MotionValue<number>; py: MotionValue<number> }) {
  const x = useTransform(px, (v) => v * def.depth);
  const y = useTransform(py, (v) => v * def.depth);
  const style: CSSProperties = {
    left: def.left,
    top: def.top,
    width: def.size,
    height: def.size,
    clipPath: def.clip,
    background: `linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.04) 46%, ${TINT[def.tint]})`,
    WebkitBackdropFilter: "blur(8px) brightness(1.25)",
    backdropFilter: "blur(8px) brightness(1.25)",
  };
  return (
    <motion.div className={`absolute ${def.className ?? ""}`} style={{ left: def.left, top: def.top, x, y, rotate: def.rotate }}>
      <div
        className="[animation:float-y_9s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{ animationDelay: `${def.delay}s` }}
      >
        <div style={{ ...style, position: "relative", left: 0, top: 0 }} />
      </div>
    </motion.div>
  );
}

/** Cacos de vidro flutuando no fundo, com profundidade (parallax) pelo ponteiro. */
export function GlassShards({ px, py }: { px: MotionValue<number>; py: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const spx = useSpring(px, { stiffness: 60, damping: 18 });
  const spy = useSpring(py, { stiffness: 60, damping: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SHARDS.map((s, i) => (
        <Shard key={i} def={s} px={reduce ? px : spx} py={reduce ? py : spy} />
      ))}
    </div>
  );
}
