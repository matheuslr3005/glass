import { SPONSORS } from "../content";

/** Faixa de patrocinadores, a única faixa em movimento da página. */
export function Marquee() {
  const row = [...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS];
  return (
    <div
      className="marquee relative border-y border-white/10 bg-white/[0.03] py-5 backdrop-blur-sm"
      aria-label={`Patrocinadores: ${SPONSORS.join(", ")}`}
    >
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map((n) => (
          <div key={n} className="flex shrink-0 items-center">
            {row.map((name, i) => (
              <span key={`${n}-${i}`} className="flex items-center">
                <span className="px-8 font-display text-2xl font-medium uppercase tracking-[0.2em] text-steel md:px-12 md:text-3xl">
                  {name}
                </span>
                <span className="size-1.5 rotate-45 bg-white/30" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
