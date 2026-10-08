import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FilmSlate, Play } from "@phosphor-icons/react";
import { AFTER_MOVIES, AFTER_MOVIE_SLOTS, EVENTS, type AfterMovie } from "../content";
import { eventDate } from "../lib";
import { track } from "../analytics";
import { GlassBackdrop } from "./GlassBackdrop";
import { Reveal } from "./Reveal";

interface Item {
  id: string;
  title: string;
  date: string;
  cover?: string;
  accent: string;
  youtube?: string;
  mp4?: string;
}

function resolve(m: AfterMovie): Item {
  const event = EVENTS.find((e) => e.id === m.eventId);
  return {
    id: m.id,
    title: m.title ?? event?.title ?? "After Movie",
    date: m.dateLabel ?? (event ? eventDate(event).day : ""),
    cover: m.poster ?? event?.flyer,
    accent: event?.accent ?? "#7fe3ff",
    youtube: m.youtube || undefined,
    mp4: m.mp4 || undefined,
  };
}

const hasVideo = (i: Item) => Boolean(i.youtube || i.mp4);

/** Capa do vídeo: o cartaz da festa, desfocado atrás, com o cartaz inteiro por cima. */
function Cover({ item, children }: { item: Item; children: React.ReactNode }) {
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-obsidian" style={{ "--accent": item.accent } as React.CSSProperties}>
      {item.cover && <img src={item.cover} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-45 blur-2xl" aria-hidden="true" />}
      <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_50%,transparent,rgba(5,5,7,0.7))]" />
      {item.cover && (
        <img
          src={item.cover}
          alt={`Cartaz: ${item.title}`}
          className="absolute left-[6%] top-1/2 hidden h-[84%] -translate-y-1/2 -rotate-3 rounded-2xl object-cover shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/25 sm:block"
        />
      )}
      <div className="relative z-10 text-center sm:ml-[28%]">{children}</div>
    </div>
  );
}

function Player({ item, playing, onPlay, onEnded }: { item: Item; playing: boolean; onPlay: () => void; onEnded: () => void }) {
  if (playing && item.youtube) {
    return (
      <iframe
        title={`After Movie: ${item.title}`}
        src={`https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0&modestbranding=1`}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }
  if (playing && item.mp4) {
    return <video src={item.mp4} controls autoPlay playsInline onEnded={onEnded} className="aspect-video w-full bg-ink object-contain" />;
  }
  return (
    <Cover item={item}>
      {hasVideo(item) ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Assistir o After Movie: ${item.title}`}
          className="group flex flex-col items-center gap-4"
        >
          <span className="flex size-20 items-center justify-center rounded-full border border-white/40 bg-white/15 shadow-[0_0_60px_-10px_var(--accent)] backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
            <Play size={30} weight="fill" />
          </span>
          <span className="font-display text-3xl font-light">Assistir</span>
        </button>
      ) : (
        <>
          <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
            <FilmSlate size={28} />
          </span>
          <p className="mt-4 font-display text-3xl font-light">After Movie em breve</p>
          <p className="mt-1 text-sm text-steel">O vídeo desta noite chega por aqui.</p>
        </>
      )}
    </Cover>
  );
}

/** Galeria de After Movies das festas que já rolaram: um player grande e as abas dos vídeos. */
export function AfterMovies() {
  const items = useMemo(() => AFTER_MOVIES.map(resolve), []);
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [playingId, setPlayingId] = useState<string | null>(null);
  // depois do primeiro play, as outras abas já começam tocando, como uma sequência
  const [started, setStarted] = useState(false);

  const active = items.find((i) => i.id === activeId) ?? items[0];
  const empty = Math.max(0, AFTER_MOVIE_SLOTS - items.length);

  const select = (item: Item) => {
    setActiveId(item.id);
    setPlayingId(started && hasVideo(item) ? item.id : null);
    track("aftermovie_select", { id: item.id });
  };
  const play = (item: Item) => {
    setStarted(true);
    setPlayingId(item.id);
    track("aftermovie_play", { id: item.id });
  };
  const playNext = () => {
    const playable = items.filter(hasVideo);
    const at = playable.findIndex((i) => i.id === activeId);
    const next = playable[at + 1];
    if (next) {
      setActiveId(next.id);
      setPlayingId(next.id);
    } else setPlayingId(null);
  };

  if (!active) return null;

  return (
    <section id="aftermovies" className="relative scroll-mt-20 overflow-clip">
      <GlassBackdrop variant="fluted" />
      <div className="relative mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-ice">Quem foi, viu</p>
        <h2 className="mt-3 font-display text-[clamp(3rem,8vw,6.5rem)] font-light leading-none">After Movies</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-steel">Reveja as noites que já passaram pela Glass. Escolha uma festa e dê o play.</p>
      </Reveal>

      <Reveal className="mt-12" delay={0.1}>
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <div className="glass overflow-hidden rounded-card" style={{ "--accent": active.accent } as React.CSSProperties}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <Player item={active} playing={playingId === active.id} onPlay={() => play(active)} onEnded={playNext} />
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <h3 className="font-display text-3xl font-medium leading-none">{active.title}</h3>
                <p className="mt-1.5 text-sm text-steel">{active.date}</p>
              </div>
              <span className="size-3 rounded-full" style={{ background: active.accent, boxShadow: `0 0 18px ${active.accent}` }} />
            </div>
          </div>

          <div
            role="tablist"
            aria-label="After Movies"
            className="hide-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:px-0"
          >
            {items.map((item) => {
              const on = item.id === active.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => select(item)}
                  className={`group relative w-40 shrink-0 overflow-hidden rounded-2xl border text-left transition-[border-color,transform] duration-300 active:scale-[0.97] lg:w-auto ${
                    on ? "border-white/70" : "border-white/10 hover:border-white/40"
                  }`}
                  style={on ? { boxShadow: `0 0 30px -8px ${item.accent}` } : undefined}
                >
                  <div className="aspect-[4/5] w-full bg-smoke">
                    {item.cover && <img src={item.cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/20 to-transparent" />
                  <span className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-ink/60 backdrop-blur">
                    {hasVideo(item) ? <Play size={14} weight="fill" /> : <FilmSlate size={14} />}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-display text-xl font-medium leading-tight">{item.title}</p>
                    <p className="text-xs text-steel">{item.date}</p>
                  </div>
                </button>
              );
            })}
            {Array.from({ length: empty }, (_, n) => (
              <div
                key={n}
                aria-hidden="true"
                className="flex w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-steel/70 max-lg:aspect-[4/5] lg:aspect-[4/5] lg:w-auto"
              >
                <FilmSlate size={22} />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">Em breve</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
