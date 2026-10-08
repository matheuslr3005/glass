import { Pyramid } from "./Pyramid";

/**
 * Wordmark GLASS, com a pirâmide no lugar do A. O tamanho vem do font-size do pai.
 * A pirâmide tem a altura das letras maiúsculas e apoia na mesma linha de base do texto.
 */
export function Logo({ className = "", glow = false, pyramid = true }: { className?: string; glow?: boolean; pyramid?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Glass"
      className={`inline-block whitespace-nowrap font-display font-light uppercase leading-none tracking-[0.06em] ${className}`}
    >
      <span aria-hidden="true">GL</span>
      <Pyramid
        glow={glow}
        className={`mx-[0.05em] inline-block h-[0.63em] w-[0.82em] align-baseline ${pyramid ? "" : "invisible"}`}
      />
      <span aria-hidden="true">SS</span>
    </span>
  );
}
