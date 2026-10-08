import { useCallback, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { ArrowUpRight, Clock, MapPin } from "@phosphor-icons/react";
import { SITE, type GlassEvent } from "../content";
import { eventDate, MAPS_URL, pastEvents, upcomingEvents } from "../lib";
import { trackGlare } from "../hooks";
import { Button } from "./Button";
import { Countdown } from "./Countdown";
import { Modal } from "./Modal";
import { Reveal } from "./Reveal";
import { TicketButton } from "./TicketButton";

type Tab = "upcoming" | "past";

/** Cartaz com inclinação 3D e reflexo de vidro que segue o ponteiro. */
function FlyerButton({ event, onOpen, tilt = true }: { event: GlassEvent; onOpen: () => void; tilt?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    trackGlare(e);
    const el = ref.current;
    if (!el || !tilt || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${(nx * 14).toFixed(2)}deg) rotateX(${(-ny * 14).toFixed(2)}deg) translateZ(0)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-label={`Ver detalhes: ${event.title}`}
      className="glass group block w-full cursor-pointer overflow-hidden rounded-card p-0 text-left transition-transform duration-300 ease-out"
      style={{ "--accent": event.accent, boxShadow: `0 40px 90px -40px ${event.accent}` } as React.CSSProperties}
    >
      <motion.img
        layoutId={`flyer-${event.id}`}
        src={event.flyer}
        alt={`Cartaz: ${event.title}`}
        className="aspect-[4/5] w-full rounded-card object-cover"
      />
    </button>
  );
}

function Lineup({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">Line-up</h4>
      <ul className="mt-3 flex flex-wrap gap-2">
        {names.map((n) => (
          <li key={n} className="rounded-full border border-white/25 px-4 py-1.5 font-semibold">
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UpcomingFeature({ event, onOpen }: { event: GlassEvent; onOpen: (e: GlassEvent) => void }) {
  const date = eventDate(event);
  return (
    <div
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16"
      style={{ "--accent": event.accent } as React.CSSProperties}
    >
      <div className="w-full max-w-[420px] lg:max-w-none">
        <FlyerButton event={event} onOpen={() => onOpen(event)} />
      </div>
      <div className="grid gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">{date.weekday}</p>
          <h3 className="mt-2 font-display text-[clamp(3rem,7vw,6rem)] font-light leading-[0.95]">{event.title}</h3>
          <p className="mt-2 text-lg text-steel">{event.subtitle}</p>
        </div>
        <ul className="grid gap-3 text-mist/90">
          <li className="flex items-center gap-3">
            <Clock size={22} className="text-[color:var(--accent)]" /> {date.day}, abertura às {event.time}
          </li>
          <li className="flex items-center gap-3">
            <MapPin size={22} className="text-[color:var(--accent)]" /> {SITE.name}, {SITE.address}
          </li>
        </ul>
        <Lineup names={event.lineup} />
        <Countdown startsAt={event.startsAt} />
        <div className="flex flex-wrap gap-3">
          <TicketButton event={event} location="evento" />
          <Button variant="ghost" onClick={() => onOpen(event)} icon={<ArrowUpRight size={18} />}>
            Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
}

function PastCard({ event, onOpen }: { event: GlassEvent; onOpen: (e: GlassEvent) => void }) {
  const date = eventDate(event);
  return (
    <div>
      <FlyerButton event={event} onOpen={() => onOpen(event)} />
      <div className="mt-5">
        <h3 className="font-display text-3xl font-medium leading-tight">{event.title}</h3>
        <p className="mt-1 text-steel">
          {date.day} · {event.lineup.join(" · ") || event.subtitle}
        </p>
      </div>
    </div>
  );
}

function EventModalBody({ event }: { event: GlassEvent }) {
  const date = eventDate(event);
  const upcoming = upcomingEvents().some((e) => e.id === event.id);
  return (
    <div className="grid md:grid-cols-[minmax(0,380px)_1fr]" style={{ "--accent": event.accent } as React.CSSProperties}>
      <motion.img
        layoutId={`flyer-${event.id}`}
        src={event.flyer}
        alt={`Cartaz: ${event.title}`}
        className="aspect-[4/5] w-full object-cover max-md:max-h-[40dvh] max-md:object-top md:aspect-auto md:h-full"
      />
      <div className="flex flex-col justify-center gap-6 p-6 md:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
            {date.weekday}, {date.day}
          </p>
          <h3 className="mt-2 font-display text-5xl font-light leading-none">{event.title}</h3>
          <p className="mt-2 text-steel">{event.subtitle}</p>
        </div>
        <p className="text-lg leading-relaxed text-mist/90">{event.blurb}</p>
        <ul className="grid gap-3 text-mist/90">
          <li className="flex items-center gap-3">
            <Clock size={22} className="text-[color:var(--accent)]" /> Abertura às {event.time}
          </li>
          <li className="flex items-center gap-3">
            <MapPin size={22} className="text-[color:var(--accent)]" />
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
              {SITE.address}, {SITE.city}
            </a>
          </li>
        </ul>
        <Lineup names={event.lineup} />
        {upcoming && <TicketButton event={event} location="modal" className="self-start" />}
      </div>
    </div>
  );
}

export function Events() {
  const upcoming = upcomingEvents();
  const past = pastEvents();
  const [tab, setTab] = useState<Tab>(upcoming.length ? "upcoming" : "past");
  const [open, setOpen] = useState<GlassEvent | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "upcoming", label: "Próximos" },
    { id: "past", label: "Já rolou" },
  ];

  return (
    <section id="eventos" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-ice">Agenda</p>
        <h2 className="mt-3 font-display text-[clamp(3rem,8vw,6.5rem)] font-light leading-none">Eventos</h2>
      </Reveal>

      <div role="tablist" aria-label="Eventos" className="mt-10 inline-flex gap-1 rounded-full border border-white/15 bg-white/[0.04] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-11 rounded-full px-6 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-mist text-ink" : "text-steel hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <LayoutGroup>
        <div className="mt-12" role="tabpanel">
          {tab === "upcoming" &&
            (upcoming.length ? (
              <div className="grid gap-20">
                {upcoming.map((e) => (
                  <UpcomingFeature key={e.id} event={e} onOpen={setOpen} />
                ))}
              </div>
            ) : (
              <p className="max-w-md font-display text-3xl font-light text-steel">
                Nenhuma data aberta agora. Segue {SITE.instagramHandle} que a próxima noite sai primeiro lá.
              </p>
            ))}
          {tab === "past" && (
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <PastCard key={e.id} event={e} onOpen={setOpen} />
              ))}
            </div>
          )}
        </div>
        <Modal open={Boolean(open)} onClose={close} label={open ? `Detalhes: ${open.title}` : "Detalhes"}>
          {open && <EventModalBody event={open} />}
        </Modal>
      </LayoutGroup>
    </section>
  );
}
