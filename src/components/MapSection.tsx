import { GlassBackdrop } from "./GlassBackdrop";
import { Reveal } from "./Reveal";
import { VenueMap } from "./VenueMap";

export function MapSection() {
  return (
    <section id="mapa" className="relative scroll-mt-20 overflow-clip">
      <GlassBackdrop variant="blueprint" />
      <div className="relative mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-ice">Conheça a casa</p>
        <h2 className="mt-3 font-display text-[clamp(3rem,8vw,6.5rem)] font-light leading-none">Mapa 3D</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-steel">
          Veja onde ficam os camarotes, as mesas VIP, o palco do DJ, os sidestages e os bares antes de escolher o seu lugar.
        </p>
      </Reveal>
      <Reveal className="mt-12" delay={0.1}>
        <VenueMap />
      </Reveal>
      </div>
    </section>
  );
}
