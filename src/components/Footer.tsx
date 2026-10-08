import { ArrowUpRight, InstagramLogo, MapPin } from "@phosphor-icons/react";
import { SITE, SPONSORS } from "../content";
import { MAPS_URL, upcomingEvents } from "../lib";
import { track } from "../analytics";
import { Logo } from "./Logo";
import { TicketButton } from "./TicketButton";

/** Final da página: logo grande, endereço, Instagram e ingressos. */
export function Footer() {
  const next = upcomingEvents()[0];
  return (
    <footer id="contato" className="relative scroll-mt-20 overflow-clip border-t border-white/10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_110%,rgba(183,156,255,0.22),transparent),radial-gradient(50%_50%_at_15%_0%,rgba(127,227,255,0.1),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-24 md:px-8 md:pt-32">
        <div className="text-center">
          <Logo glow className="text-[clamp(4.5rem,20vw,16rem)] text-mist" />
          <p className="mx-auto mt-6 max-w-md font-display text-3xl font-light text-steel">{SITE.tagline}</p>
        </div>

        <div className="mx-auto mt-14 flex flex-wrap items-center justify-center gap-3">
          {next && <TicketButton event={next} location="final" />}
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("instagram_click", { location: "final" })}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-6 text-[15px] font-semibold backdrop-blur-md transition-colors hover:border-white/70"
          >
            <InstagramLogo size={20} /> {SITE.instagramHandle}
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-6 text-[15px] font-semibold backdrop-blur-md transition-colors hover:border-white/70"
          >
            <MapPin size={20} /> Como chegar <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-steel md:flex-row">
          <p>
            {SITE.name} · {SITE.address} · {SITE.city}
          </p>
          <p>Ingressos pela {SITE.ticketing} · {SPONSORS.slice(0, 2).join(" · ")} e mais</p>
        </div>
      </div>
    </footer>
  );
}
