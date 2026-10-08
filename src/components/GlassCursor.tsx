import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/** Bolha de vidro que segue o mouse e cresce sobre o que dá para clicar. Só com mouse e sem movimento reduzido. */
export function GlassCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 480, damping: 40, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 480, damping: 40, mass: 0.35 });
  const scale = useSpring(1, { stiffness: 300, damping: 22 });

  useEffect(() => {
    setEnabled(!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [reduce]);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-glass-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      scale.set(el?.closest("a, button, [role='tab'], input, textarea, select, [data-grab]") ? 2.1 : 1);
    };
    const down = () => scale.set(0.8);
    const up = () => scale.set(1);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      document.documentElement.classList.remove("has-glass-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled, x, y, scale]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0"
      style={{ x: sx, y: sy, zIndex: "var(--z-cursor)" }}
    >
      <motion.div
        className="size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.45),inset_-3px_-3px_8px_rgba(127,227,255,0.35),0_0_18px_rgba(127,227,255,0.25)] backdrop-blur-[2px] backdrop-brightness-125"
        style={{ scale }}
      >
        <div className="absolute left-[18%] top-[14%] h-[26%] w-[34%] -rotate-[30deg] rounded-full bg-white/70 blur-[1px]" />
      </motion.div>
    </motion.div>
  );
}
