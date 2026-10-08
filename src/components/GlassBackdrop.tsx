import { asset } from "../asset";

/** Luzes coloridas de cada textura, vistas através do vidro. */
const GLOW = {
  fluted:
    "radial-gradient(38% 60% at 14% 35%, rgba(255,122,217,0.5), transparent 70%), radial-gradient(36% 55% at 82% 62%, rgba(183,156,255,0.5), transparent 70%), radial-gradient(28% 40% at 52% 12%, rgba(255,207,122,0.28), transparent 70%)",
  blueprint:
    "radial-gradient(40% 55% at 18% 35%, rgba(138,255,193,0.3), transparent 70%), radial-gradient(38% 50% at 82% 65%, rgba(127,227,255,0.38), transparent 70%), radial-gradient(30% 40% at 52% 14%, rgba(183,156,255,0.3), transparent 70%)",
  facets:
    "radial-gradient(40% 55% at 16% 30%, rgba(127,227,255,0.42), transparent 70%), radial-gradient(36% 50% at 80% 70%, rgba(183,156,255,0.36), transparent 70%), radial-gradient(26% 36% at 50% 88%, rgba(127,227,255,0.2), transparent 70%)",
} as const;

/**
 * Textura de vidro atrás de uma seção, na largura toda.
 * - `fluted`: vidro canelado (After Movies), com luz rosa e violeta por trás.
 * - `facets`: facetas de cristal (Aluguel), com luz gelo e violeta.
 * - `blueprint`: planta técnica sobre vidro fosco (Mapa 3D), com luz verde-água e gelo.
 */
export function GlassBackdrop({ variant }: { variant: keyof typeof GLOW }) {
  return (
    <div className="tx" aria-hidden="true">
      <div className="tx-glow" style={{ "--tx-glow": GLOW[variant] } as React.CSSProperties} />
      {variant === "fluted" && <div className="tx-fluted" />}
      {variant === "facets" && <div className="tx-facets" style={{ backgroundImage: `url(${asset("textures/facets.svg")})` }} />}
      {variant === "blueprint" && (
        <>
          <div className="tx-grain" />
          <div className="tx-blueprint" />
        </>
      )}
    </div>
  );
}
