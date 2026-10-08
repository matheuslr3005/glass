import { useId } from "react";

const SCALES = [1, 0.79, 0.59, 0.41, 0.25];
const BASE: [number, number][] = [
  [4, 80],
  [50, 4],
  [96, 80],
];
const ANCHOR: [number, number] = [96, 80];

const trianglePath = (s: number): string =>
  BASE.map(([x, y], i) => {
    const px = ANCHOR[0] + (x - ANCHOR[0]) * s;
    const py = ANCHOR[1] + (y - ANCHOR[1]) * s;
    return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(" ") + "Z";

/** A pirâmide do logo: cinco triângulos de cromo que se abrem em leque. */
export function Pyramid({ className = "", glow = false }: { className?: string; glow?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 86" className={className} aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={`chrome-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#8da0b4" />
          <stop offset="0.6" stopColor="#eaf4fb" />
          <stop offset="1" stopColor="#6d7c8c" />
        </linearGradient>
        {glow && (
          <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        )}
      </defs>
      {glow && (
        <g fill="none" stroke="#7fe3ff" strokeWidth="2.4" opacity="0.55" filter={`url(#glow-${id})`}>
          {SCALES.map((s) => (
            <path key={s} d={trianglePath(s)} />
          ))}
        </g>
      )}
      <g fill="none" stroke={`url(#chrome-${id})`} strokeWidth="2" strokeLinejoin="round">
        {SCALES.map((s, i) => (
          <path key={s} d={trianglePath(s)} opacity={1 - i * 0.07} />
        ))}
      </g>
    </svg>
  );
}
