import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useInView, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { ArrowsClockwise, Cube, HandGrabbing, MapTrifold } from "@phosphor-icons/react";
import { KIND_COLOR, SITE, ZONES, type Zone, type ZoneKind } from "../content";
import { contactLink } from "../lib";
import { track } from "../analytics";
import { Button } from "./Button";

/* ---------- Geometria da planta (unidades do tabuleiro: 100 de largura x 108 de fundo) ---------- */

interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
}

const BOARD = { w: 100, d: 108 };
const DJ = { cx: 46, cy: 52, r: 17 };
/** Distância da câmera, em unidades do tabuleiro. */
const PERSPECTIVE = 340;

const GEO: Record<string, Rect> = {
  entrada: { x: 8, y: 6, w: 22, d: 18, h: 0.5 },
  pista: { x: 27, y: 29, w: 42, d: 50, h: 0.5 },
  b1: { x: 34, y: 5, w: 30, d: 22, h: 7 },
  s1: { x: 69, y: 5, w: 24, d: 13, h: 6 },
  s2: { x: 69, y: 20, w: 24, d: 16, h: 6 },
  c1: { x: 8, y: 28, w: 18, d: 13, h: 5 },
  c2: { x: 8, y: 42, w: 18, d: 13, h: 5 },
  c3: { x: 8, y: 56, w: 18, d: 13, h: 5 },
  vip1: { x: 69, y: 39, w: 24, d: 16, h: 3.6 },
  vip2: { x: 69, y: 57, w: 24, d: 16, h: 3.6 },
  bar: { x: 14, y: 80, w: 52, d: 20, h: 5.5 },
};

/** Áreas com sofá desenhado, e a posição do sofá dentro delas. */
const SOFAS: Record<string, { x: number; y: number; w: number }> = {
  s2: { x: 3, y: 9, w: 18 },
  vip1: { x: 3, y: 9, w: 18 },
  vip2: { x: 3, y: 9, w: 18 },
};

type ViewId = "iso" | "plan";

/** Em tela estreita a vista 3D gira menos, para a planta caber na largura. */
const viewTarget = (v: ViewId, narrow: boolean) => (v === "plan" ? { rx: 0, rz: 0 } : { rx: 52, rz: narrow ? -14 : -28 });

const KIND_INFO: { kind: ZoneKind; label: string; text: string }[] = [
  { kind: "camarote", label: "Camarote", text: "Área elevada e privativa, para o seu grupo." },
  { kind: "mesa", label: "Mesa VIP", text: "Mesa com sofá, ao lado da pista." },
  { kind: "sidestage", label: "Sidestage", text: "Ao lado do palco, para ver o DJ de perto." },
  { kind: "palco", label: "Palco", text: "O palco do DJ, no centro da casa." },
  { kind: "bar", label: "Bar", text: "O bar principal, de frente para a pista." },
  { kind: "backstage", label: "Backstage", text: "Bastidores, com acesso restrito." },
  { kind: "pista", label: "Pista", text: "O centro da noite, em volta do palco." },
  { kind: "entrada", label: "Entrada", text: "Por onde você entra na casa." },
];

const zoneById = (id: string): Zone => ZONES.find((z) => z.id === id)!;
const em = (n: number) => `${n}em`;

/* ---------- Peças 3D ---------- */

interface BoxProps extends Rect {
  /** Altura da base (z). */
  z?: number;
  color: string;
  lit?: boolean;
  /** Quando tem id, o bloco reage a mouse e toque. */
  id?: string;
  onHover?: (id: string | null) => void;
  onPick?: (id: string) => void;
  children?: ReactNode;
  className?: string;
}

/** Bloco de vidro com seis faces, posicionado no plano do tabuleiro. */
function Box({ x, y, w, d, h, z = 0, color, lit, id, onHover, onPick, children, className = "" }: BoxProps) {
  const interactive = Boolean(id);
  return (
    <div
      className={`vm-box ${lit ? "vm-lit" : ""} ${className}`}
      data-grab={interactive ? "" : undefined}
      style={
        {
          left: em(x),
          top: em(y),
          width: em(w),
          height: em(d),
          "--z": em(z),
          "--c": color,
        } as CSSProperties
      }
      onPointerEnter={interactive ? () => onHover?.(id!) : undefined}
      onPointerLeave={interactive ? () => onHover?.(null) : undefined}
      onClick={interactive ? () => onPick?.(id!) : undefined}
    >
      <div className="vm-face vm-top inset-0" style={{ transform: `translateZ(${em(h)})` }} />
      <div className="vm-face" style={{ left: 0, top: em(d), width: em(w), height: em(h), transformOrigin: "top", transform: "rotateX(90deg)" }} />
      <div className="vm-face" style={{ left: 0, top: em(-h), width: em(w), height: em(h), transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      <div className="vm-face" style={{ left: em(w), top: 0, width: em(h), height: em(d), transformOrigin: "left", transform: "rotateY(-90deg)" }} />
      <div className="vm-face" style={{ left: em(-h), top: 0, width: em(h), height: em(d), transformOrigin: "right", transform: "rotateY(90deg)" }} />
      {children}
    </div>
  );
}

function Sofa({ x, y, w, base, color }: { x: number; y: number; w: number; base: number; color: string }) {
  const d = 5;
  return (
    <>
      <Box x={x} y={y} w={w} d={d} h={1.5} z={base} color={color} />
      <Box x={x} y={y - 1.1} w={w} d={1.1} h={3.4} z={base} color={color} />
      <Box x={x - 1.1} y={y - 1.1} w={1.1} d={d + 1.1} h={2.6} z={base} color={color} />
      <Box x={x + w} y={y - 1.1} w={1.1} d={d + 1.1} h={2.6} z={base} color={color} />
    </>
  );
}

function Stairs({ x, y, d, steps, hMax, dir, color, z = 0 }: { x: number; y: number; d: number; steps: number; hMax: number; dir: 1 | -1; color: string; z?: number }) {
  const stepW = 1.5;
  return (
    <>
      {Array.from({ length: steps }, (_, i) => {
        const h = hMax * (1 - i / steps);
        const sx = dir === 1 ? x + i * stepW : x - (i + 1) * stepW;
        return <Box key={i} x={sx} y={y} w={stepW} d={d} h={h} z={z} color={color} />;
      })}
    </>
  );
}

/**
 * Rótulo desenhado por cima do mapa, sem 3D: a posição do ponto na tela é calculada com a mesma
 * rotação e perspectiva da planta. Assim o texto fica sempre de frente e nenhum bloco o corta.
 */
function Label({ x, y, z, text, rx, rz, unit, tone }: { x: number; y: number; z: number; text: string; rx: MotionValue<number>; rz: MotionValue<number>; unit: MotionValue<number>; tone?: string }) {
  const transform = useTransform([rx, rz, unit], ([a, b, u]: number[]) => {
    const px = x - BOARD.w / 2;
    const py = y - BOARD.d / 2;
    const rzr = (b * Math.PI) / 180;
    const rxr = (a * Math.PI) / 180;
    const x1 = px * Math.cos(rzr) - py * Math.sin(rzr);
    const y1 = px * Math.sin(rzr) + py * Math.cos(rzr);
    const y2 = y1 * Math.cos(rxr) - z * Math.sin(rxr);
    const z2 = y1 * Math.sin(rxr) + z * Math.cos(rxr);
    const k = PERSPECTIVE / (PERSPECTIVE - z2);
    return `translate(${(x1 * k * u).toFixed(1)}px, ${(y2 * k * u).toFixed(1)}px) translate(-50%, -50%)`;
  });
  return (
    <motion.span
      className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full border border-white/25 bg-ink/65 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm md:text-[11px]"
      style={{ transform, ...(tone ? { borderColor: tone } : {}) }}
    >
      {text}
    </motion.span>
  );
}

/* ---------- Mapa ---------- */

export function VenueMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [kind, setKind] = useState<ZoneKind | null>(null);
  const [view, setView] = useState<ViewId>("iso");
  const [narrow, setNarrow] = useState(false);
  const touched = useRef(false);

  const stage = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState(5);
  const rx = useMotionValue<number>(52);
  const rz = useMotionValue<number>(-120);
  const unitMV = useMotionValue<number>(5);
  const boardTransform = useTransform([rx, rz], ([a, b]: number[]) => `rotateX(${a}deg) rotateZ(${b}deg)`);
  const inView = useInView(stage, { once: true, amount: 0.3 });
  const drag = useRef({ active: false, moved: false, x: 0, y: 0 });

  // o tamanho da planta acompanha a largura do cartão
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const isNarrow = entry.contentRect.width < 560;
      setNarrow(isNarrow);
      const u = Math.min(7.6, entry.contentRect.width / (isNarrow ? 118 : 146));
      setUnit(u);
      unitMV.set(u);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [unitMV]);

  // ao entrar na tela, a planta gira até a posição inicial
  useEffect(() => {
    if (!inView || touched.current) return;
    const target = viewTarget("iso", narrow).rz;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) rz.set(target);
    else animate(rz, target, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, rz]);

  const goTo = (v: ViewId) => {
    touched.current = true;
    setView(v);
    const target = viewTarget(v, narrow);
    const turns = Math.round((rz.get() - target.rz) / 360);
    animate(rx, target.rx, { type: "spring", stiffness: 90, damping: 18 });
    animate(rz, target.rz + turns * 360, { type: "spring", stiffness: 90, damping: 18 });
    track("map_view", { view: v });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    touched.current = true;
    d.x = e.clientX;
    d.y = e.clientY;
    rz.set(rz.get() + dx * 0.35);
    rx.set(Math.max(0, Math.min(82, rx.get() - dy * 0.3)));
    setView(rx.get() < 2 && Math.abs(rz.get() % 360) < 2 ? "plan" : "iso");
  };
  const onPointerUp = () => {
    drag.current.active = false;
    // o "clique" que vem logo depois de um arraste não seleciona nada
    window.setTimeout(() => (drag.current.moved = false), 0);
  };

  const pick = (id: string) => {
    if (drag.current.moved) return;
    setSelected((cur) => (cur === id ? null : id));
    setKind(null);
    track("map_zone", { zone: id });
  };

  const lit = (id: string) => {
    const z = zoneById(id);
    if (hover === id || selected === id) return true;
    if (!selected && kind && z.kind === kind) return true;
    return false;
  };
  const color = (id: string) => KIND_COLOR[zoneById(id).kind];

  const active = useMemo(() => {
    const id = selected ?? hover;
    return id ? zoneById(id) : null;
  }, [selected, hover]);

  const grouped = useMemo(() => KIND_INFO.map((k) => ({ ...k, zones: ZONES.filter((z) => z.kind === k.kind) })), []);

  const reservable = active && (active.kind === "camarote" || active.kind === "mesa" || active.kind === "sidestage");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <div className="glass overflow-hidden rounded-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="inline-flex gap-1 rounded-full border border-white/15 bg-white/[0.04] p-1" role="group" aria-label="Visão do mapa">
            {(
              [
                { id: "iso", label: "3D", icon: <Cube size={16} /> },
                { id: "plan", label: "Planta", icon: <MapTrifold size={16} /> },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={view === v.id}
                onClick={() => goTo(v.id)}
                className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                  view === v.id ? "bg-mist text-ink" : "text-steel hover:text-white"
                }`}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-steel">
            <HandGrabbing size={16} /> Arraste para girar · toque nas áreas
          </p>
        </div>

        <div
          ref={stage}
          data-grab
          className="relative touch-pan-y select-none overflow-hidden"
          style={{ height: unit * 138, cursor: "grab", fontSize: unit, perspective: unit * PERSPECTIVE }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(e) => {
            // clique no vazio limpa a seleção
            if (e.target === e.currentTarget && !drag.current.moved) setSelected(null);
          }}
          role="img"
          aria-label="Mapa 3D da casa. Use a lista ao lado para ler cada área."
        >
          <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(127,227,255,0.12),transparent)]" aria-hidden="true" />
          <motion.div
            className="absolute left-1/2 top-1/2"
            style={{
              width: em(BOARD.w),
              height: em(BOARD.d),
              marginLeft: em(-BOARD.w / 2),
              marginTop: em(-BOARD.d / 2),
              transformStyle: "preserve-3d",
              transform: boardTransform,
            }}
          >
            {/* sombra e placa de vidro */}
            <div
              className="absolute"
              style={{ left: em(-14), top: em(-12), width: em(128), height: em(132), transform: `translateZ(${em(-6)})`, background: "radial-gradient(closest-side, rgba(0,0,0,0.75), transparent)" }}
            />
            <Box x={-4} y={-4} w={108} d={116} h={3} z={-3} color="#cfe3ff" className="vm-slab" />

            {/* áreas abertas */}
            <Box {...GEO.pista!} id="pista" color={color("pista")} lit={lit("pista")} onHover={setHover} onPick={pick} className="vm-floor" />
            <Box {...GEO.entrada!} id="entrada" color={color("entrada")} lit={lit("entrada")} onHover={setHover} onPick={pick} className="vm-floor" />

            {/* blocos */}
            {(["b1", "s1", "s2", "c1", "c2", "c3", "vip1", "vip2", "bar"] as const).map((id) => {
              const g = GEO[id]!;
              const sofa = SOFAS[id];
              return (
                <Box key={id} {...g} id={id} color={color(id)} lit={lit(id)} onHover={setHover} onPick={pick}>
                  {sofa && <Sofa x={sofa.x} y={sofa.y} w={sofa.w} base={g.h} color={color(id)} />}
                </Box>
              );
            })}

            {/* escadas */}
            {(["c1", "c2", "c3"] as const).map((id) => (
              <Stairs key={id} x={GEO[id]!.x + GEO[id]!.w} y={GEO[id]!.y + 2} d={GEO[id]!.d - 4} steps={3} hMax={GEO[id]!.h - 1.2} dir={1} color={color(id)} />
            ))}
            <Stairs x={GEO.bar!.x} y={GEO.bar!.y + 3} d={GEO.bar!.d - 6} steps={4} hMax={GEO.bar!.h - 1} dir={-1} color={color("bar")} />

            {/* palco do DJ: base, prato girando e braço */}
            <div
              className={`vm-box vm-dj pointer-events-none ${lit("dj") ? "vm-lit" : ""}`}
              style={{ inset: 0, "--z": "0em", "--c": color("dj") } as CSSProperties}
            >
              {[0, 1.5, 3].map((z) => (
                <div
                  key={z}
                  className="vm-face vm-disc pointer-events-auto"
                  data-grab
                  onPointerEnter={() => setHover("dj")}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => pick("dj")}
                  style={{ left: em(DJ.cx - DJ.r), top: em(DJ.cy - DJ.r), width: em(DJ.r * 2), height: em(DJ.r * 2), transform: `translateZ(${em(z)})` }}
                />
              ))}
              <div className="pointer-events-none absolute" style={{ left: em(DJ.cx - 14), top: em(DJ.cy - 14), width: em(28), height: em(28), transform: `translateZ(${em(3.3)})` }}>
                <div className="vm-record relative size-full rounded-full">
                  <div className="vm-sheen absolute inset-0 rounded-full" />
                  <div className="absolute left-1/2 top-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mist shadow-[0_0_0_0.3em_rgba(255,255,255,0.25)]" />
                  <div className="absolute left-1/2 top-1/2 size-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
                </div>
              </div>
              <div
                className="pointer-events-none absolute origin-top"
                style={{
                  left: em(DJ.cx + 13),
                  top: em(DJ.cy - 15),
                  width: em(1.1),
                  height: em(19),
                  transform: `translateZ(${em(3.8)}) rotateZ(-24deg)`,
                  background: "linear-gradient(180deg,#fff,#9fb2c6)",
                  borderRadius: em(0.6),
                  boxShadow: "0 0 1.2em rgba(255,255,255,0.7)",
                }}
              />
            </div>

          </motion.div>
          {/* rótulos por cima da planta */}
          <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
            <Label rx={rx} rz={rz} unit={unitMV} x={19} y={15} z={1.2} text="Entrada ↓" tone="rgba(138,255,193,0.7)" />
            <Label rx={rx} rz={rz} unit={unitMV} x={48} y={16} z={GEO.b1!.h + 1} text={narrow ? "B1" : "B1 Backstage"} />
            <Label rx={rx} rz={rz} unit={unitMV} x={81} y={11.5} z={GEO.s1!.h + 1} text="S1" />
            <Label rx={rx} rz={rz} unit={unitMV} x={81} y={25} z={GEO.s2!.h + 5} text="S2" />
            <Label rx={rx} rz={rz} unit={unitMV} x={17} y={34.5} z={GEO.c1!.h + 1} text="C1" />
            <Label rx={rx} rz={rz} unit={unitMV} x={17} y={48.5} z={GEO.c2!.h + 1} text="C2" />
            <Label rx={rx} rz={rz} unit={unitMV} x={17} y={62.5} z={GEO.c3!.h + 1} text="C3" />
            <Label rx={rx} rz={rz} unit={unitMV} x={DJ.cx} y={DJ.cy} z={7} text="DJ Stage" tone="rgba(255,255,255,0.7)" />
            <Label rx={rx} rz={rz} unit={unitMV} x={81} y={46} z={GEO.vip1!.h + 5} text="VIP 1" />
            <Label rx={rx} rz={rz} unit={unitMV} x={81} y={64} z={GEO.vip2!.h + 5} text="VIP 2" />
            <Label rx={rx} rz={rz} unit={unitMV} x={40} y={90} z={GEO.bar!.h + 1} text="Bar" />
            <Label rx={rx} rz={rz} unit={unitMV} x={47.5} y={74} z={1} text="Pista" />
          </div>
          <button
            type="button"
            onClick={() => goTo("iso")}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Restaurar a vista 3D"
            className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-white/20 bg-ink/60 backdrop-blur transition hover:border-white/60"
          >
            <ArrowsClockwise size={18} />
          </button>
        </div>
      </div>

      {/* painel de leitura */}
      <div className="flex flex-col gap-4">
        <div className="glass min-h-[15rem] rounded-card p-6" aria-live="polite">
          {active ? (
            <div key={active.id}>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ borderColor: KIND_COLOR[active.kind], color: KIND_COLOR[active.kind] }}
              >
                <span className="size-2 rounded-full" style={{ background: KIND_COLOR[active.kind] }} />
                {active.kindLabel}
              </span>
              <h3 className="mt-4 font-display text-4xl font-medium leading-none">{active.title}</h3>
              <p className="mt-3 leading-relaxed text-steel">{active.description}</p>
              {reservable && (
                <div className="mt-5">
                  <Button
                    href={contactLink(`Oi! Quero reservar ${active.title} na ${SITE.name}.`)}
                    external
                    trackEvent={["reserve_click", { zone: active.id }]}
                  >
                    Reservar {active.title}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice">Como ler o mapa</p>
              <h3 className="mt-3 font-display text-4xl font-light leading-[1.05]">Toque numa área para saber o que é.</h3>
              <p className="mt-3 text-steel">
                Gire a planta, passe o mouse ou escolha uma área na lista. O que é camarote, o que é mesa, onde fica o palco e os bares aparece aqui.
              </p>
            </div>
          )}
        </div>

        <ul className="glass grid gap-1 rounded-card p-3">
          {grouped.map((g) => (
            <li key={g.kind}>
              <div
                className={`flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5 transition-colors ${
                  kind === g.kind && !selected ? "bg-white/10" : ""
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-[8.5rem] items-center gap-2 text-left text-sm font-semibold"
                  aria-pressed={kind === g.kind}
                  onClick={() => {
                    setSelected(null);
                    setKind((k) => (k === g.kind ? null : g.kind));
                  }}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[g.kind], boxShadow: `0 0 10px ${KIND_COLOR[g.kind]}` }} />
                  {g.label}
                </button>
                <span className="hidden flex-1 text-xs text-steel sm:block">{g.text}</span>
                <span className="ml-auto flex gap-1">
                  {g.zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      aria-pressed={selected === z.id}
                      aria-label={z.title}
                      onClick={() => pick(z.id)}
                      className={`h-8 rounded-full border px-3 text-xs font-bold transition-colors ${
                        selected === z.id ? "border-white bg-white text-ink" : "border-white/20 text-mist hover:border-white/60"
                      }`}
                    >
                      {g.zones.length > 1 ? z.label : "Ver"}
                    </button>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
