import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/** Tamanho do vidro e aumento da lente. */
const SIZE = 150;
const MAGNIFY = 1.45;
/** Formato de caco de vidro, em % do quadrado. */
const SHARD = [
  [14, 6],
  [78, 0],
  [100, 46],
  [84, 94],
  [22, 100],
  [0, 48],
] as const;
const CLIP = `polygon(${SHARD.map(([x, y]) => `${x}% ${y}%`).join(",")})`;
const OUTLINE = SHARD.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * Mapa de deslocamento da lente: cada pixel do vidro puxa a cor de um ponto mais perto do centro,
 * o que amplia o que está por baixo. Perto da borda a curvatura aumenta, como num vidro grosso.
 */
function lensMap(): { url: string; scale: number } {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);
  const half = SIZE / 2;
  const shift = 1 - 1 / MAGNIFY;
  // deslocamento máximo possível, para caber na faixa 0..255 do canal de cor
  const scale = half * shift * 1.25 * 2;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - half;
      const dy = y - half;
      const r = Math.min(1, Math.hypot(dx, dy) / half);
      const bend = 1 + 0.22 * r * r * r;
      const i = (y * SIZE + x) * 4;
      img.data[i] = Math.round(128 + 127 * ((-dx * shift * bend) / (scale / 2)));
      img.data[i + 1] = Math.round(128 + 127 * ((-dy * shift * bend) / (scale / 2)));
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: c.toDataURL(), scale };
}

/** Só o Chrome e os navegadores baseados nele aceitam um filtro SVG no backdrop-filter. */
const canRefract = () => typeof navigator !== "undefined" && /Chrome\//.test(navigator.userAgent);

/**
 * Pedaço de vidro que segue o mouse. Onde o navegador permite (Chrome, Edge), ele amplia e entorta o que passa
 * por baixo, como uma lente; nos outros, vira um vidro que clareia e dá brilho. Só com mouse e sem movimento reduzido.
 */
export function GlassCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [lens, setLens] = useState<{ url: string; scale: number } | null>(null);
  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const scale = useSpring(1, { stiffness: 420, damping: 24 });
  const tilt = useSpring(0, { stiffness: 260, damping: 18 });

  useEffect(() => {
    setEnabled(!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [reduce]);

  useEffect(() => {
    if (enabled && canRefract()) setLens(lensMap());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-glass-cursor");
    let last = 0;
    const move = (e: PointerEvent) => {
      // sem atraso: o vidro fica exatamente onde o mouse está
      x.set(e.clientX);
      y.set(e.clientY);
      // e inclina um pouco para o lado em que o mouse anda
      const dx = e.clientX - last;
      last = e.clientX;
      tilt.set(Math.max(-14, Math.min(14, dx * 0.9)));
    };
    const over = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      scale.set(el?.closest("a, button, [role='tab'], input, textarea, select, [data-grab]") ? 1.2 : 1);
    };
    const down = () => scale.set(0.9);
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
  }, [enabled, x, y, scale, tilt]);

  if (!enabled) return null;

  const backdrop = lens
    ? "url(#glass-lens) brightness(1.1) saturate(1.3) contrast(1.04)"
    : "blur(0.4px) brightness(1.18) saturate(1.35)";

  return (
    <>
      {lens && (
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <filter id="glass-lens" x="0" y="0" width={SIZE} height={SIZE} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={lens.url} x="0" y="0" width={SIZE} height={SIZE} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={lens.scale} xChannelSelector="R" yChannelSelector="G" result="bent" />
            {/* o deslocamento amplia pixel a pixel; um leve desfoque tira o serrilhado */}
            <feGaussianBlur in="bent" stdDeviation="0.65" />
          </filter>
        </svg>
      )}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0"
        style={{ x, y, zIndex: "var(--z-cursor)" }}
      >
        <motion.div style={{ scale, rotate: tilt, width: SIZE, height: SIZE, marginLeft: -SIZE / 2, marginTop: -SIZE / 2 }}>
          {/* o vidro: filtra o que está por trás */}
          <div
            className="absolute inset-0"
            style={{ clipPath: CLIP, WebkitBackdropFilter: backdrop, backdropFilter: backdrop }}
          />
          {/* bordas, brilho e reflexo por cima */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id="cursor-shine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="0.28" stopColor="#fff" stopOpacity="0.06" />
                <stop offset="0.7" stopColor="#9fd8ff" stopOpacity="0.03" />
                <stop offset="1" stopColor="#bda8ff" stopOpacity="0.32" />
              </linearGradient>
            </defs>
            <polygon points={OUTLINE} fill="url(#cursor-shine)" />
            <polygon points={OUTLINE} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polygon
              points="20,14 74,8 94,44"
              fill="none"
              stroke="rgba(190,235,255,0.55)"
              strokeWidth="1"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <line x1="28" y1="30" x2="52" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* ponto de mira no centro, para clicar com precisão */}
          <span className="absolute left-1/2 top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
        </motion.div>
      </motion.div>
    </>
  );
}
