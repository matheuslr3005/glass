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

/** A abertura toca ao abrir o site. Não toca com "reduzir movimento" nem em links com #seção. */
function shouldPlay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !window.location.hash;
}

export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<Phase>(() => (shouldPlay() ? "playing" : "done"));
  const setPhase = useCallback((p: Phase) => setPhaseState(p), []);
  const value = useMemo(() => ({ phase, revealed: phase !== "playing", setPhase }), [phase, setPhase]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

/** Tempo até o vidro quebrar sozinho, se ninguém tocar. */
const AUTO_BREAK_MS = 3400;
/** Rachaduras se espalhando antes de os cacos se soltarem. */
const CRACK_MS = 620;

type Impact = { x: number; y: number; fast: boolean };

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Abertura: um vidro escuro com o logo. Ao toque (ou sozinho) ele racha a partir do ponto de impacto,
 * quebra em cacos que caem em 3D e o site aparece por trás.
 * Movimento: só transform e opacity, por Web Animations (sem re-render por quadro).
 */
export function Intro() {
  const { phase, setPhase } = useIntro();
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [impact, setImpact] = useState<Impact | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const shardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const crackRefs = useRef<(SVGPathElement | null)[]>([]);
  const flash = useRef<HTMLDivElement>(null);
  const ringEl = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const fracture: Fracture | null = useMemo(() => {
    if (!impact) return null;
    const small = size.w < 700;
    return buildFracture(size.w, size.h, impact.x, impact.y, small ? 11 : 15, small ? 6 : 7);
  }, [impact, size]);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // trava a rolagem enquanto a abertura toca
  useEffect(() => {
    if (phase === "done") {
      document.documentElement.style.overflow = "";
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      return;
    }
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

  // quebra sozinho, no centro, depois de alguns segundos
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setTimeout(() => breakGlass(window.innerWidth / 2, window.innerHeight * 0.46), AUTO_BREAK_MS);
    return () => window.clearTimeout(id);
  }, [phase, breakGlass]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        breakGlass(window.innerWidth / 2, window.innerHeight * 0.46, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, breakGlass]);

  // a quebra em si
  useEffect(() => {
    if (!impact || !fracture) return;
    const k = impact.fast ? 0.55 : 1;
    let alive = true;

    void (async () => {
      const el = root.current;
      // impacto: clarão, onda de choque e tremor
      flash.current?.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 520 * k, easing: "ease-out", fill: "forwards" });
      ringEl.current?.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.2)", opacity: 0.9 },
          { transform: "translate(-50%,-50%) scale(46)", opacity: 0 },
        ],
        { duration: 900 * k, easing: "cubic-bezier(0.1,0.7,0.2,1)", fill: "forwards" },
      );
      el?.animate(
        [
          { transform: "translate(0,0)" },
          { transform: "translate(-6px,4px)" },
          { transform: "translate(5px,-5px)" },
          { transform: "translate(-3px,2px)" },
          { transform: "translate(0,0)" },
        ],
        { duration: 340 * k, easing: "ease-out" },
      );

      // rachaduras se espalham
      crackRefs.current.forEach((path, i) => {
        if (!path) return;
        const isSpoke = i < fracture.spokes.length;
        path.animate(
          isSpoke
            ? [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }]
            : [{ opacity: 0 }, { opacity: 1 }],
          {
            duration: (isSpoke ? 420 : 260) * k,
            delay: (isSpoke ? rand(0, 110) : 140 + (i - fracture.spokes.length) * 55) * k,
            easing: "cubic-bezier(0.2,0.7,0.2,1)",
            fill: "both",
          },
        );
      });

      await wait(CRACK_MS * k);
      if (!alive) return;
      setPhase("revealing");

      logo.current?.animate(
        [
          { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
          { opacity: 0, transform: "scale(1.5)", filter: "blur(8px)" },
        ],
        { duration: 650 * k, easing: "ease-in", fill: "forwards" },
      );

      // os cacos se soltam: os do centro vêm para a câmera, os de fora caem
      let longest = 0;
      fracture.shards.forEach((s, i) => {
        const node = shardRefs.current[i];
        if (!node) return;
        const near = 1 - s.dist;
        const dx = (s.cx - impact.x) * (0.15 + near * 0.9) + rand(-30, 30);
        const dy = (s.cy - impact.y) * (0.15 + near * 0.7) + 220 + s.dist * rand(500, 1000);
        const dz = near * near * 760 + rand(-80, 80);
        const end = `translate3d(${dx}px,${dy}px,${dz}px) rotateX(${rand(-200, 200)}deg) rotateY(${rand(-200, 200)}deg) rotateZ(${rand(-140, 140)}deg)`;
        const duration = (1000 + s.dist * 700 + rand(0, 380)) * k;
        const delay = (s.dist * 430 + rand(0, 110)) * k;
        longest = Math.max(longest, duration + delay);
        node.animate(
          [
            { transform: "translate3d(0,0,0)", opacity: 1 },
            { transform: "translate3d(0,0,0) rotateZ(0.6deg)", opacity: 1, offset: 0.08 },
            { transform: end, opacity: 0 },
          ],
          { duration, delay, easing: "cubic-bezier(0.5,0.02,0.85,0.5)", fill: "both" },
        );
      });

      await wait(longest + 80);
      if (!alive) return;
      setPhase("done");
    })();

    return () => {
      alive = false;
    };
  }, [impact, fracture, setPhase]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = root.current;
    if (!el || started.current) return;
    el.style.setProperty("--px", `${e.clientX}px`);
    el.style.setProperty("--py", `${e.clientY}px`);
  }, []);

  if (phase === "done") return null;

  const { w, h } = size;

  return (
    <div
      ref={root}
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: "var(--z-intro)", perspective: 1400, perspectiveOrigin: "50% 50%", touchAction: "none" }}
      role="dialog"
      aria-label="Abertura do site"
      onPointerMove={onPointerMove}
      onPointerDown={(e) => {
        if (phase === "playing") breakGlass(e.clientX, e.clientY);
      }}
    >
      {/* definição do vidro, compartilhada pelo painel inteiro e por todos os cacos */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="glass-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h}>
            <stop offset="0" stopColor="#06070c" />
            <stop offset="0.32" stopColor="#0b0d16" />
            <stop offset="0.43" stopColor="#192034" />
            <stop offset="0.47" stopColor="#2b3857" />
            <stop offset="0.5" stopColor="#141a2b" />
            <stop offset="0.56" stopColor="#22304d" />
            <stop offset="0.62" stopColor="#0a0d17" />
            <stop offset="1" stopColor="#040509" />
          </linearGradient>
        </defs>
      </svg>

      {!fracture && (
        <>
          <svg width={w} height={h} className="absolute inset-0" aria-hidden="true">
            <rect width={w} height={h} fill="url(#glass-fill)" />
          </svg>
          {/* brilho que acompanha o ponteiro e reflexo que atravessa o vidro */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(360px circle at var(--px, 50%) var(--py, 40%), rgba(160,215,255,0.16), transparent 62%)",
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 overflow-hidden" aria-hidden="true">
            <div
              className="h-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]"
              style={{ animation: "glint 4.2s ease-in-out 0.6s infinite" }}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 border border-white/10 shadow-[inset_0_0_120px_rgba(127,227,255,0.07)]" />
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
                style={{
                  left: s.x,
                  top: s.y,
                  width: s.w,
                  height: s.h,
                  transformOrigin: `${s.cx - s.x}px ${s.cy - s.y}px`,
                  backfaceVisibility: "visible",
                }}
              >
                <svg viewBox={`${s.x} ${s.y} ${s.w} ${s.h}`} width={s.w} height={s.h} className="block overflow-visible">
                  <polygon points={s.points.map((p) => p.join(",")).join(" ")} fill="url(#glass-fill)" />
                  <polygon
                    points={s.points.map((p) => p.join(",")).join(" ")}
                    fill="#cfe8ff"
                    fillOpacity={(0.01 + ((s.id * 37) % 11) / 11 * 0.07).toFixed(3)}
                    stroke="rgba(190,225,255,0.55)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>
          {/* rachaduras por cima dos cacos, até eles se soltarem */}
          <svg width={w} height={h} className="pointer-events-none absolute inset-0" aria-hidden="true">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {[...fracture.spokes, ...fracture.rings].map((d, i) => (
                <path
                  key={i}
                  ref={(node) => {
                    crackRefs.current[i] = node;
                  }}
                  d={d}
                  pathLength={1}
                  strokeDasharray={i < fracture.spokes.length ? 1 : undefined}
                  stroke="rgba(235,247,255,0.85)"
                  strokeWidth={i < fracture.spokes.length ? 1.4 : 0.9}
                  style={{ filter: "drop-shadow(0 0 3px rgba(127,227,255,0.8))" }}
                />
              ))}
            </g>
          </svg>
        </>
      )}

      {/* logo no vidro */}
      <div
        ref={logo}
        className="pointer-events-none absolute inset-x-0 top-[46%] flex -translate-y-1/2 flex-col items-center gap-6"
      >
        <Logo glow className="text-[clamp(3.4rem,13vw,8.5rem)] text-mist" />
        {!impact && (
          <p className="text-xs font-semibold uppercase tracking-[0.42em] text-steel/80 [animation:float-y_2.6s_ease-in-out_infinite]">
            Toque no vidro
          </p>
        )}
      </div>

      {impact && (
        <>
          <div
            ref={flash}
            className="pointer-events-none absolute inset-0 opacity-0"
            style={{
              background: `radial-gradient(circle at ${impact.x}px ${impact.y}px, rgba(255,255,255,0.95), rgba(160,215,255,0.35) 22%, transparent 55%)`,
            }}
          />
          <div
            ref={ringEl}
            className="pointer-events-none absolute size-10 rounded-full border-2 border-white/80 opacity-0"
            style={{ left: impact.x, top: impact.y }}
          />
        </>
      )}

      {!impact && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => breakGlass(window.innerWidth / 2, window.innerHeight * 0.46, true)}
          className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 h-11 -translate-x-1/2 rounded-full border border-white/25 px-5 text-sm font-medium text-mist/80 transition hover:border-white hover:text-white"
        >
          Pular
        </button>
      )}
    </div>
  );
}
