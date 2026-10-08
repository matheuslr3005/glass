import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Luz que passa pelo vidro: grava --mx/--my (em px, relativos ao alvo) seguindo o mouse.
 * Sem mouse (celular) ou antes do primeiro movimento, a luz varre sozinha.
 * `onMove` recebe a posição normalizada (-0.5 a 0.5) da seção, para parallax.
 */
export function useSpotlight(
  section: RefObject<HTMLElement | null>,
  target: RefObject<HTMLElement | null>,
  onMove?: (nx: number, ny: number) => void,
) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const sec = section.current;
    const el = target.current;
    if (!sec || !el) return;

    let tx = 0.5;
    let ty = 0.5;
    let x = tx;
    let y = ty;
    let manual = false;
    let visible = true;
    let raf = 0;
    let t0 = performance.now();

    const apply = () => {
      el.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
    };

    const tick = (now: number) => {
      if (!manual) {
        const t = (now - t0) / 1000;
        tx = 0.5 + Math.sin(t * 0.55) * 0.42;
        ty = 0.5 + Math.cos(t * 0.8) * 0.18;
      }
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      apply();
      raf = visible && !reduce ? requestAnimationFrame(tick) : 0;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      manual = true;
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      const s = sec.getBoundingClientRect();
      onMove?.((e.clientX - s.left) / s.width - 0.5, (e.clientY - s.top) / s.height - 0.5);
    };
    const leave = () => {
      manual = false;
      t0 = performance.now();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(sec);
    sec.addEventListener("pointermove", move, { passive: true });
    sec.addEventListener("pointerleave", leave);
    apply();
    raf = requestAnimationFrame(tick);

    return () => {
      io.disconnect();
      sec.removeEventListener("pointermove", move);
      sec.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [section, target, onMove, reduce]);
}

/** Grava --gx/--gy (px) no elemento, para o reflexo de vidro seguir o ponteiro. */
export function trackGlare(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--gx", `${e.clientX - r.left}px`);
  el.style.setProperty("--gy", `${e.clientY - r.top}px`);
}
