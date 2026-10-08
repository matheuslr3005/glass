import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildFracture, type Fracture } from "../shatter";
import { Logo } from "./Logo";

type Phase = "playing" | "revealing" | "done";

interface IntroState {
  phase: Phase;
  /** Vira true quando o site começa a aparecer (ou logo de cara, sem abertura). */
  revealed: boolean;
  setPhase: (p: Phase) => void;
}

const IntroContext = createContext<IntroState>({ phase: "done", revealed: true, setPhase: () => undefined });
export const useIntro = () => useContext(IntroContext);

/** A abertura toca a cada vez que o site abre ou é atualizado. Só não toca com "reduzir movimento". */
function shouldPlay(): boolean {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Seção do endereço (#mapa, #eventos...) no momento em que a página abriu. */
const INITIAL_HASH = typeof window === "undefined" ? "" : window.location.hash;

export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<Phase>(() => (shouldPlay() ? "playing" : "done"));
  const setPhase = useCallback((p: Phase) => setPhaseState(p), []);
  const value = useMemo(() => ({ phase, revealed: phase !== "playing", setPhase }), [phase, setPhase]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

/** O logo aparece no vidro e, depois disso, ele leva a pancada sozinho. Tudo dura cerca de 3 s. */
const LEAD_MS = 800;
/** As rachaduras correm pelo vidro antes de os cacos se soltarem. */
const CRACK_MS = 330;

type Impact = { x: number; y: number; fast: boolean };

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
/** Queda livre: começa devagar e acelera. */
const GRAVITY = "cubic-bezier(0.55, 0.085, 0.68, 0.53)";

/**
 * Abertura: um vidro com o logo, por cima do site. O vidro leva uma pancada, racha a partir do
 * impacto e cai em cacos, e o site aparece por trás. Não precisa de toque: é uma animação só.
 * Movimento: só transform e opacity, por Web Animations (sem re-render por quadro).
 */
export function Intro() {
  const { phase, setPhase } = useIntro();
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [impact, setImpact] = useState<Impact | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const cracks = useRef<SVGSVGElement>(null);
  const shardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const crackRefs = useRef<(SVGPathElement | null)[]>([]);
  const flash = useRef<HTMLDivElement>(null);
  const ringEl = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const fracture: Fracture | null = useMemo(() => {
    if (!impact) return null;
    const small = size.w < 700;
    return buildFracture(size.w, size.h, impact.x, impact.y, small ? 12 : 17, small ? 6 : 8, Math.floor(impact.x * 7 + impact.y));
  }, [impact, size]);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // trava a rolagem enquanto a abertura toca
  const played = useRef(false);
  useEffect(() => {
    if (phase === "done") {
      document.documentElement.style.overflow = "";
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      // a abertura segura a rolagem no topo: depois dela, vai para a seção do endereço
      if (played.current && INITIAL_HASH) {
        played.current = false;
        requestAnimationFrame(() => document.getElementById(decodeURIComponent(INITIAL_HASH.slice(1)))?.scrollIntoView({ behavior: "instant" }));
      }
      return;
    }
    played.current = true;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = previous;
    };
  }, [phase]);

  const breakGlass = useCallback((x: number, y: number, fast = false) => {
    if (started.current) return;
    started.current = true;
    setImpact({ x, y, fast });
  }, []);

  // o logo surge no vidro e a pancada vem sozinha
  useEffect(() => {
    if (phase !== "playing") return;
    logo.current?.animate(
      [
        { opacity: 0, transform: "scale(0.94)", filter: "blur(6px)" },
        { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
      ],
      { duration: 650, easing: "cubic-bezier(0.2,0.7,0.2,1)", fill: "both" },
    );
    const id = window.setTimeout(() => breakGlass(window.innerWidth * 0.52, window.innerHeight * 0.45), LEAD_MS);
    return () => window.clearTimeout(id);
  }, [phase, breakGlass]);

  // quem quiser pular: Esc, Enter, espaço ou um toque quebram o vidro na hora
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        breakGlass(window.innerWidth * 0.52, window.innerHeight * 0.45, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, breakGlass]);

  // a quebra em si
  useEffect(() => {
    if (!impact || !fracture) return;
    const k = impact.fast ? 0.6 : 1;
    const { h } = size;
    let alive = true;

    void (async () => {
      // pancada: clarão, onda de choque e um tranco na tela
      flash.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380 * k, easing: "ease-out", fill: "forwards" });
      ringEl.current?.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.2)", opacity: 0.9 },
          { transform: "translate(-50%,-50%) scale(40)", opacity: 0 },
        ],
        { duration: 700 * k, easing: "cubic-bezier(0.1,0.7,0.2,1)", fill: "forwards" },
      );
      root.current?.animate(
        [
          { transform: "translate(0,0)" },
          { transform: "translate(-4px,3px)" },
          { transform: "translate(3px,-3px)" },
          { transform: "translate(-2px,1px)" },
          { transform: "translate(0,0)" },
        ],
        { duration: 260 * k, easing: "ease-out" },
      );

      // lascas saltam do ponto de impacto: primeiro para fora, depois caem
      fracture.chips.forEach((c, i) => {
        const node = chipRefs.current[i];
        if (!node) return;
        const a = Math.atan2(c.cy - impact.y, c.cx - impact.x);
        const burst = rand(90, 360);
        const dx = Math.cos(a) * burst;
        const dy = Math.sin(a) * burst;
        const spin = `rotateX(${rand(-300, 300)}deg) rotateY(${rand(-300, 300)}deg) rotateZ(${rand(-200, 200)}deg)`;
        node.animate(
          [
            { transform: "translate3d(0,0,0)", opacity: 1, easing: "cubic-bezier(0.1,0.7,0.3,1)" },
            { transform: `translate3d(${dx}px,${dy * 0.5}px,${rand(20, 120)}px) rotateZ(90deg)`, opacity: 1, offset: 0.35, easing: GRAVITY },
            { transform: `translate3d(${dx * 1.15}px,${dy + rand(250, 700)}px,0) ${spin}`, opacity: 0 },
          ],
          { duration: rand(750, 1200) * k, delay: rand(0, 60), fill: "both" },
        );
      });

      // rachaduras correm pelo vidro
      const spokeCount = fracture.spokes.length;
      const branchCount = fracture.branches.length;
      crackRefs.current.forEach((path, i) => {
        if (!path) return;
        const isRing = i >= spokeCount + branchCount;
        const isBranch = !isRing && i >= spokeCount;
        path.animate(
          isRing ? [{ opacity: 0 }, { opacity: 1 }] : [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          {
            duration: (isRing ? 160 : isBranch ? 200 : 260) * k,
            delay: (isRing ? 70 + (i - spokeCount - branchCount) * 30 : isBranch ? 110 + rand(0, 90) : rand(0, 60)) * k,
            easing: "cubic-bezier(0.2,0.7,0.2,1)",
            fill: "both",
          },
        );
      });

      await wait(CRACK_MS * k);
      if (!alive) return;
      setPhase("revealing");

      // as rachaduras são só um desenho: somem quando o vidro de verdade começa a cair
      cracks.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
      logo.current?.animate(
        [
          { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
          { opacity: 0, transform: "scale(1.18)", filter: "blur(8px)" },
        ],
        { duration: 520 * k, easing: "ease-in", fill: "forwards" },
      );

      // os cacos se soltam do centro para fora e caem com gravidade
      let longest = 0;
      fracture.shards.forEach((s, i) => {
        const node = shardRefs.current[i];
        if (!node) return;
        const near = 1 - s.dist;
        const dx = (s.cx - impact.x) * (0.04 + near * 0.3) + rand(-16, 16);
        const dy = h * (0.85 + s.dist * 0.45) + rand(0, 180);
        const dz = near * near * 240 + rand(-40, 40);
        const spin = 1 + near;
        const end = `translate3d(${dx}px,${dy}px,${dz}px) rotateX(${rand(-120, 120) * spin}deg) rotateY(${rand(-80, 80) * spin}deg) rotateZ(${rand(-50, 50) * spin}deg)`;
        const duration = (650 + s.dist * 400 + rand(0, 350)) * k;
        const delay = (s.dist * 240 + rand(0, 90)) * k;
        longest = Math.max(longest, duration + delay);
        node.animate(
          [
            { transform: "translate3d(0,0,0)", opacity: 1 },
            { transform: `translate3d(0,0,0) rotateZ(${rand(-0.8, 0.8).toFixed(2)}deg)`, opacity: 1, offset: 0.07 },
            { transform: end, opacity: 0.95, offset: 0.82 },
            { transform: end, opacity: 0 },
          ],
          { duration, delay, easing: GRAVITY, fill: "both" },
        );
      });

      await wait(longest + 60);
      if (!alive) return;
      setPhase("done");
    })();

    return () => {
      alive = false;
    };
  }, [impact, fracture, setPhase, size]);

  if (phase === "done") return null;

  const { w, h } = size;
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");

  return (
    <div
      ref={root}
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: "var(--z-intro)", perspective: 1400, perspectiveOrigin: "50% 50%", touchAction: "none" }}
      role="dialog"
      aria-label="Abertura do site"
      onPointerDown={(e) => {
        if (phase === "playing") breakGlass(e.clientX, e.clientY, true);
      }}
    >
      {/* o vidro: translúcido, com reflexos; é compartilhado pelo painel inteiro e por todos os cacos */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="glass-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h}>
            <stop offset="0" stopColor="#07101a" stopOpacity="0.64" />
            <stop offset="0.3" stopColor="#0a1523" stopOpacity="0.5" />
            <stop offset="0.42" stopColor="#6d93bd" stopOpacity="0.14" />
            <stop offset="0.47" stopColor="#d8ecff" stopOpacity="0.24" />
            <stop offset="0.52" stopColor="#6d93bd" stopOpacity="0.1" />
            <stop offset="0.6" stopColor="#0a1220" stopOpacity="0.5" />
            <stop offset="1" stopColor="#04070c" stopOpacity="0.68" />
          </linearGradient>
          {[
            [0, 0, 1, 1],
            [1, 0, 0, 1],
            [0, 0.2, 1, 0.8],
            [0.3, 0, 0.7, 1],
          ].map(([x1, y1, x2, y2], n) => (
            <linearGradient key={n} id={`shine-${n}`} x1={x1} y1={y1} x2={x2} y2={y2}>
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.45" stopColor="#dff0ff" stopOpacity="0.34" />
              <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#9fd0ff" stopOpacity="0.12" />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {!fracture && (
        <>
          <svg width={w} height={h} className="absolute inset-0" aria-hidden="true">
            <rect width={w} height={h} fill="url(#glass-fill)" />
          </svg>
          {/* reflexo que atravessa o vidro */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 overflow-hidden" aria-hidden="true">
            <div
              className="h-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]"
              style={{ animation: "glint 1.9s ease-in-out 0.1s 1" }}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 border border-white/10 shadow-[inset_0_0_140px_rgba(127,227,255,0.1)]" />
        </>
      )}

      {fracture && (
        <>
          <div className="absolute inset-0">
            {fracture.shards.map((s, i) => (
              <div
                key={s.id}
                ref={(node) => {
                  shardRefs.current[i] = node;
                }}
                className="absolute will-change-transform"
                style={{ left: s.x, top: s.y, width: s.w, height: s.h, transformOrigin: `${s.cx - s.x}px ${s.cy - s.y}px` }}
              >
                <svg viewBox={`${s.x} ${s.y} ${s.w} ${s.h}`} width={s.w} height={s.h} className="block overflow-visible">
                  <polygon points={poly(s.points)} fill="url(#glass-fill)" />
                  <polygon
                    points={poly(s.points)}
                    fill={`url(#shine-${s.id % 4})`}
                    fillOpacity={(0.35 + ((s.id * 37) % 11) / 11 * 0.65).toFixed(2)}
                    stroke="rgba(205,235,255,0.6)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* rachaduras por cima dos cacos, só até eles se soltarem */}
          <svg ref={cracks} width={w} height={h} className="pointer-events-none absolute inset-0" aria-hidden="true">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 2px rgba(150,215,255,0.9))" }}>
              {[...fracture.spokes, ...fracture.branches, ...fracture.rings].map((d, i) => {
                const spokeCount = fracture.spokes.length;
                const isSpoke = i < spokeCount;
                const isRing = i >= spokeCount + fracture.branches.length;
                return (
                  <path
                    key={i}
                    ref={(node) => {
                      crackRefs.current[i] = node;
                    }}
                    d={d}
                    pathLength={1}
                    strokeDasharray={isRing ? undefined : 1}
                    stroke="rgba(240,249,255,0.9)"
                    strokeWidth={isSpoke ? 1.3 : isRing ? 0.8 : 0.7}
                  />
                );
              })}
            </g>
          </svg>

          {/* lascas */}
          <div className="absolute inset-0">
            {fracture.chips.map((c, i) => (
              <div
                key={c.id}
                ref={(node) => {
                  chipRefs.current[i] = node;
                }}
                className="absolute"
                style={{ left: c.x, top: c.y, width: c.w, height: c.h, transformOrigin: `${c.cx - c.x}px ${c.cy - c.y}px` }}
              >
                <svg viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} width={c.w} height={c.h} className="block overflow-visible">
                  <polygon points={poly(c.points)} fill="rgba(225,243,255,0.8)" stroke="#fff" strokeWidth="0.6" />
                </svg>
              </div>
            ))}
          </div>
        </>
      )}

      {/* logo no vidro */}
      <div ref={logo} className="pointer-events-none absolute inset-x-0 top-[46%] flex -translate-y-1/2 justify-center opacity-0">
        <Logo glow className="text-[clamp(3.4rem,13vw,8.5rem)] text-mist" />
      </div>

      {impact && (
        <>
          <div
            ref={flash}
            className="pointer-events-none absolute inset-0 opacity-0"
            style={{
              background: `radial-gradient(circle at ${impact.x}px ${impact.y}px, rgba(255,255,255,1), rgba(190,225,255,0.45) 9%, transparent 26%)`,
            }}
          />
          <div
            ref={ringEl}
            className="pointer-events-none absolute size-10 rounded-full border-2 border-white/80 opacity-0"
            style={{ left: impact.x, top: impact.y }}
          />
        </>
      )}
    </div>
  );
}
