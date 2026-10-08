/**
 * Fratura de vidro a partir de um ponto de impacto.
 * Raios saem do impacto e anéis irregulares os cruzam, como uma teia: cada célula vira um caco.
 */

export interface Shard {
  id: number;
  /** Vértices em coordenadas da tela. */
  points: [number, number][];
  x: number;
  y: number;
  w: number;
  h: number;
  /** Centro do caco e distância normalizada (0 = impacto, 1 = canto mais longe). */
  cx: number;
  cy: number;
  dist: number;
}

export interface Fracture {
  shards: Shard[];
  /** Rachaduras radiais (do impacto até a borda). */
  spokes: string[];
  /** Rachaduras em anel, da mais próxima à mais distante. */
  rings: string[];
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

export function buildFracture(w: number, h: number, ix: number, iy: number, spokes: number, rings: number, seed = 7): Fracture {
  const rand = rng(seed);
  const maxR = Math.hypot(Math.max(ix, w - ix), Math.max(iy, h - iy)) * 1.18;

  const radius = (k: number) => maxR * Math.pow(k / rings, 1.85);
  const base = Array.from({ length: spokes }, (_, j) => ((j + (rand() - 0.5) * 0.55) / spokes) * Math.PI * 2);

  // grade de vértices compartilhados entre cacos vizinhos
  const V: [number, number][][] = [];
  for (let k = 0; k <= rings; k++) {
    const row: [number, number][] = [];
    for (let j = 0; j < spokes; j++) {
      if (k === 0) {
        row.push([ix, iy]);
        continue;
      }
      const gap = radius(k) - radius(k - 1);
      const r = k === rings ? radius(k) : radius(k) + (rand() - 0.5) * gap * 0.5;
      const a = base[j]! + (rand() - 0.5) * (Math.PI / spokes) * 0.45;
      row.push([ix + r * Math.cos(a), iy + r * Math.sin(a)]);
    }
    V.push(row);
  }

  const shards: Shard[] = [];
  const add = (points: [number, number][]) => {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
    const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
    shards.push({
      id: shards.length,
      points,
      x,
      y,
      w: Math.max(...xs) - x,
      h: Math.max(...ys) - y,
      cx,
      cy,
      dist: Math.min(1, Math.hypot(cx - ix, cy - iy) / maxR),
    });
  };

  for (let j = 0; j < spokes; j++) {
    const n = (j + 1) % spokes;
    add([V[0]![j]!, V[1]![j]!, V[1]![n]!]);
    for (let k = 2; k <= rings; k++) {
      const a = V[k - 1]![j]!;
      const b = V[k]![j]!;
      const c = V[k]![n]!;
      const d = V[k - 1]![n]!;
      // parte dos cacos externos é cortada na diagonal, para variar o tamanho
      if (k > 2 && rand() < 0.42) {
        if (rand() < 0.5) {
          add([a, b, c]);
          add([a, c, d]);
        } else {
          add([a, b, d]);
          add([b, c, d]);
        }
      } else {
        add([a, b, c, d]);
      }
    }
  }

  const spokePaths = Array.from({ length: spokes }, (_, j) => `M${V.map((row) => fmt(row[j]!)).join(" L")}`);
  const ringPaths = Array.from({ length: rings }, (_, i) => {
    const row = V[i + 1]!;
    return `M${row.map(fmt).join(" L")} L${fmt(row[0]!)}`;
  });

  return { shards, spokes: spokePaths, rings: ringPaths };
}
