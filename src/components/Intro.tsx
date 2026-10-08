import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildFracture } from "../shatter";

type Phase = "playing" | "revealing" | "done";

interface IntroState {
  phase: Phase;
  /** Vira true quando o site começa a aparecer (ou logo de cara, sem abertura). */
  revealed: boolean;
  setPhase: (p: Phase) => void;
}

const IntroContext = createContext<IntroState>({ phase: "done", revealed: true, setPhase: () => undefined });
export const useIntro = () => useContext(IntroContext);

/** Atualizar a página (F5) sempre volta ao topo, sem seção no endereço, e a abertura toca de novo. */
if (typeof window !== "undefined") {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
  window.scrollTo(0, 0);
}

/** A abertura toca a cada vez que o site abre ou é atualizado. Só não toca com "reduzir movimento". */
function shouldPlay(): boolean {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<Phase>(() => (shouldPlay() ? "playing" : "done"));
  const setPhase = useCallback((p: Phase) => setPhaseState(p), []);
  const value = useMemo(() => ({ phase, revealed: phase !== "playing", setPhase }), [phase, setPhase]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

/** O vidro e o logo surgem no escuro e, depois disso, o vidro leva a pancada sozinho. */
const LEAD_MS = 900;
/** As rachaduras correm pelo vidro antes de os cacos se soltarem. */
const CRACK_MS = 340;

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Abertura: a tela escurece, o logo aparece gravado num vidro e o vidro racha e cai
 * em cacos 3D (WebGL, com espessura, reflexo e gravidade). O site aparece por trás. É uma animação só.
 * Se o WebGL não estiver disponível, a abertura é pulada e o site abre direto.
 */
export function Intro() {
  const { phase, setPhase } = useIntro();
  const [size] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const impactAt = useMemo(() => ({ x: size.w * 0.52, y: size.h * 0.45 }), [size]);
  const fracture = useMemo(() => {
    const small = size.w < 700;
    return buildFracture(size.w, size.h, impactAt.x, impactAt.y, small ? 12 : 17, small ? 6 : 8, 11);
  }, [size, impactAt]);

  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const cracks = useRef<SVGSVGElement>(null);
  const crackRefs = useRef<(SVGPathElement | null)[]>([]);
  const skip = useRef<() => void>(() => undefined);
  // a cena começa uma vez só: mudar de fase no meio da abertura não pode desmontá-la
  const playOnce = useRef(phase === "playing");

  // trava a rolagem enquanto a abertura toca, e a deixa no topo
  useEffect(() => {
    if (phase === "done") {
      document.documentElement.style.overflow = "";
      return;
    }
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = previous;
    };
  }, [phase]);

  useEffect(() => {
    if (!playOnce.current || !host.current) return;
    let alive = true;
    let dispose: () => void = () => undefined;
    const hostEl = host.current;

    void (async () => {
      let glass;
      try {
        const { createGlassScene } = await import("../glass3d");
        glass = await createGlassScene(hostEl, size.w, size.h, fracture, impactAt);
      } catch (err) {
        // sem WebGL (ou erro na cena): abre o site direto
        console.warn("[abertura] pulada:", err);
        if (alive) setPhase("done");
        return;
      }
      if (!alive) {
        glass.dispose();
        return;
      }
      dispose = glass.dispose;

      let impacted = false;
      const doImpact = async (fast: boolean) => {
        if (impacted) return;
        impacted = true;
        const k = fast ? 0.6 : 1;

        glass.impact();

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
        cracks.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 40, fill: "forwards" });

        await wait(CRACK_MS * k);
        if (!alive) return;
        setPhase("revealing");

        // as rachaduras são só um desenho: somem quando o vidro de verdade começa a cair, e o escuro some
        cracks.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
        backdrop.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520 * k, easing: "ease-in", fill: "forwards" });

        await glass.release(fast);
        if (!alive) return;
        setPhase("done");
      };

      skip.current = () => void doImpact(true);
      glass.fadeIn(750);
      await wait(LEAD_MS);
      if (alive) void doImpact(false);
    })();

    return () => {
      alive = false;
      dispose();
    };
  }, [size, fracture, impactAt, setPhase]);

  // quem quiser pular: Esc, Enter, espaço ou um toque quebram o vidro na hora
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        skip.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase === "done") return null;

  const { w, h } = size;

  return (
    <div
      ref={root}
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: "var(--z-intro)", touchAction: "none" }}
      role="dialog"
      aria-label="Abertura do site"
      onPointerDown={() => {
        if (phase === "playing") skip.current();
      }}
    >
      {/* a tela escura, atrás do vidro: some quando o vidro cai */}
      <div ref={backdrop} className="absolute inset-0 bg-ink">
        <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_44%,rgba(70,110,160,0.28),transparent_70%),radial-gradient(80%_70%_at_50%_120%,rgba(120,80,170,0.16),transparent)]" />
      </div>

      {/* o vidro em 3D */}
      <div ref={host} className="absolute inset-0" />

      {/* rachaduras desenhadas por cima, só até o vidro se soltar */}
      <svg ref={cracks} width={w} height={h} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
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

    </div>
  );
}
