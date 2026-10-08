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
  /** Lascas pequenas que saltam do ponto de impacto. */
  chips: Shard[];
  /** Rachaduras radiais irregulares (do impacto até a borda). */
  spokes: string[];
  /** Pequenas ramificações que saem das rachaduras radiais. */
  branches: string[];
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

  // rachaduras radiais: o caminho entre dois anéis nunca é reto, tem um desvio no meio
  const spokePaths = Array.from({ length: spokes }, (_, j) => {
    const pts: [number, number][] = [V[0]![j]!];
    for (let k = 1; k <= rings; k++) {
      const a = V[k - 1]![j]!;
      const b = V[k]![j]!;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / (len || 1);
      const ny = (b[0] - a[0]) / (len || 1);
      const off = (rand() - 0.5) * Math.min(14, len * 0.16);
      pts.push([(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off], b);
    }
    return `M${pts.map(fmt).join(" L")}`;
  });

  // ramificações curtas, saindo de alguns pontos das rachaduras radiais
  const branchPaths: string[] = [];
  for (let j = 0; j < spokes; j++) {
    const count = rand() < 0.55 ? 2 : 1;
    for (let n = 0; n < count; n++) {
      const k = 2 + Math.floor(rand() * Math.max(1, rings - 3));
      const from = V[k]![j]!;
      const gap = radius(k + 1) - radius(k);
      const dir = base[j]! + (rand() < 0.5 ? -1 : 1) * (0.45 + rand() * 0.6);
      const len = gap * (0.35 + rand() * 0.7);
      const mid: [number, number] = [from[0] + Math.cos(dir) * len * 0.5 + (rand() - 0.5) * 6, from[1] + Math.sin(dir) * len * 0.5 + (rand() - 0.5) * 6];
      const end: [number, number] = [from[0] + Math.cos(dir + (rand() - 0.5) * 0.4) * len, from[1] + Math.sin(dir + (rand() - 0.5) * 0.4) * len];
      branchPaths.push(`M${fmt(from)} L${fmt(mid)} L${fmt(end)}`);
    }
  }

  const ringPaths = Array.from({ length: rings }, (_, i) => {
    const row = V[i + 1]!;
    return `M${row.map(fmt).join(" L")} L${fmt(row[0]!)}`;
  });

  // lascas: triângulos pequenos perto do impacto
  const chips: Shard[] = [];
  const chipCount = 34;
  for (let i = 0; i < chipCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = 4 + Math.pow(rand(), 1.6) * 150;
    const cx = ix + Math.cos(a) * r;
    const cy = iy + Math.sin(a) * r;
    const size = 3 + rand() * 10;
    const pts: [number, number][] = [0, 1, 2].map((n) => {
      const pa = rand() * 2 + n * 2.1;
      const pr = size * (0.5 + rand() * 0.7);
      return [cx + Math.cos(pa) * pr, cy + Math.sin(pa) * pr];
    });
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    chips.push({ id: i, points: pts, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, cx, cy, dist: 0 });
  }

  return { shards, chips, spokes: spokePaths, branches: branchPaths, rings: ringPaths };
}
