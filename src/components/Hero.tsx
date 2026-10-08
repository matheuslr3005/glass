import { useCallback, useRef } from "react";
import { motion, useMotionValue } from "motion/react";
import { ArrowDown, MapPin } from "@phosphor-icons/react";
import { SITE } from "../content";
import { eventDate, MAPS_URL, upcomingEvents } from "../lib";
import { useSpotlight } from "../hooks";
import { Button } from "./Button";
import { Countdown } from "./Countdown";
import { GlassShards } from "./GlassShards";
import { useIntro } from "./Intro";
import { Logo } from "./Logo";
import { TicketButton } from "./TicketButton";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const { revealed } = useIntro();
  const section = useRef<HTMLElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const next = upcomingEvents()[0];
  const date = next ? eventDate(next) : null;

  const onMove = useCallback(
    (nx: number, ny: number) => {
      px.set(nx);
      py.set(ny);
    },
    [px, py],
  );
  useSpotlight(section, word, onMove);

  const show = (delay: number, y = 24) => ({
    initial: { opacity: 0, y },
    animate: revealed ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration: 0.9, delay, ease },
  });

  return (
    <section
      ref={section}
      id="top"
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-clip pb-16 pt-28"
      style={next ? ({ "--accent": next.accent } as React.CSSProperties) : undefined}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_8%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent),radial-gradient(50%_45%_at_85%_20%,rgba(127,227,255,0.14),transparent),radial-gradient(70%_60%_at_50%_110%,rgba(183,156,255,0.16),transparent)]"
      />
      <GlassShards px={px} py={py} />

      <div className="relative mx-auto w-full max-w-7xl px-5 md:px-8">
        <motion.p
          className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.34em] text-steel"
          {...show(0.05, 12)}
        >
          <MapPin size={16} /> Porto Alegre
        </motion.p>

        <motion.div {...show(0.1, 40)}>
          <div ref={word} className="relative mx-auto w-fit select-none text-center" role="presentation">
            <h1 className="sr-only">Glass</h1>
            <div
              aria-hidden="true"
              className="text-[clamp(5.2rem,24vw,21rem)] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.3)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.03))] [background-clip:text] [-webkit-background-clip:text]"
            >
              <Logo />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 text-[clamp(5.2rem,24vw,21rem)] text-transparent [background-image:radial-gradient(circle_min(26vw,360px)_at_var(--mx,50%)_var(--my,50%),#fff_0,#cdeeff_20%,#b79cff_44%,rgba(255,122,217,0.55)_62%,transparent_78%)] [background-clip:text] [-webkit-background-clip:text]"
            >
              <Logo pyramid={false} />
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-5xl items-end gap-8 md:mt-14 md:grid-cols-[1.1fr_1fr]">
          <div>
            <motion.p
              className="max-w-md font-display text-3xl font-light leading-[1.1] md:text-4xl"
              {...show(0.35)}
            >
              {SITE.tagline}
            </motion.p>
            <motion.div className="mt-6 flex flex-wrap items-center gap-3" {...show(0.5)}>
              <Button variant="ghost" href="#eventos" icon={<ArrowDown size={18} />}>
                Ver agenda
              </Button>
              <Button variant="ghost" href={MAPS_URL} external icon={<MapPin size={18} />}>
                {SITE.address}
              </Button>
            </motion.div>
          </div>

          <motion.div className="glass overflow-hidden rounded-card p-5 md:p-6" {...show(0.45)}>
            {next && date ? (
              <>
                {/* a arte da noite, bem ao fundo: só para dizer que está ali */}
                <img
                  src={next.flyer}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 h-full w-3/4 object-cover object-[50%_28%] opacity-30 [mask-image:linear-gradient(to_left,#000_15%,transparent_95%)] [-webkit-mask-image:linear-gradient(to_left,#000_15%,transparent_95%)]"
                />
                <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">Próxima noite</p>
                <h2 className="relative mt-2 font-display text-4xl font-medium leading-none md:text-5xl">{next.title}</h2>
                <p className="relative mt-2 text-steel">
                  {date.weekday}, {date.day} · abertura às {next.time}
                </p>
                <div className="relative mt-5">
                  <Countdown startsAt={next.startsAt} compact />
                </div>
                <div className="relative mt-5 flex flex-wrap gap-3">
                  <TicketButton event={next} location="hero" />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice">Em breve</p>
                <h2 className="mt-2 font-display text-4xl font-medium leading-none">Novas datas chegando</h2>
                <p className="mt-3 text-steel">Siga {SITE.instagramHandle} para saber a próxima noite primeiro.</p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
