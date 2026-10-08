import { Pyramid } from "./Pyramid";

/** Wordmark GLASS, com a pirâmide no lugar do A. O tamanho vem do font-size do pai. */
export function Logo({ className = "", glow = false, pyramid = true }: { className?: string; glow?: boolean; pyramid?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Glass"
      className={`inline-flex items-end font-display font-light uppercase leading-none tracking-[0.06em] ${className}`}
    >
      <span aria-hidden="true">GL</span>
      <Pyramid glow={glow} className={`mx-[0.04em] mb-[0.06em] h-[0.66em] w-[0.76em] shrink-0 ${pyramid ? "" : "invisible"}`} />
      <span aria-hidden="true">SS</span>
    </span>
  );
}
