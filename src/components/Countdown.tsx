import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({ startsAt, compact = false }: { startsAt: string; compact?: boolean }) {
  const target = new Date(startsAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = target - now;
  if (diff <= 0) {
    return <p className="font-display text-3xl font-medium text-[color:var(--accent)]">Rolando agora</p>;
  }

  const { d, h, m, s } = parts(diff);
  const cells = [
    { v: d, l: "dias" },
    { v: h, l: "horas" },
    { v: m, l: "min" },
    { v: s, l: "seg" },
  ];

  return (
    <div role="timer" aria-label="Tempo até o evento" className={`grid grid-cols-4 gap-2 ${compact ? "max-w-xs" : "max-w-md"}`}>
      {cells.map((c) => (
        <div key={c.l} className="rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-3 text-center backdrop-blur">
          <div className={`font-display font-light leading-none tabular-nums ${compact ? "text-3xl" : "text-4xl md:text-5xl"}`}>
            {String(c.v).padStart(2, "0")}
          </div>
          <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-steel">{c.l}</div>
        </div>
      ))}
    </div>
  );
}
