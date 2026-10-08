import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Fracture, Shard } from "./shatter";

/** Espessura do vidro, em px (a cena usa px como unidade: 1 unidade = 1 px da tela). */
const THICKNESS = 9;
const FOV = 38;
/** Aceleração da gravidade, px/s². */
const GRAVITY = 2100;

export interface GlassScene {
  /** O vidro e o logo surgem. */
  fadeIn: (ms: number) => void;
  /** A pancada: o vidro inteiro troca pelos cacos, com as bordas aparecendo. */
  impact: () => void;
  /** Os cacos se soltam e caem. Resolve quando saíram todos da tela. */
  release: (fast: boolean) => Promise<void>;
  dispose: () => void;
}

interface Body {
  mesh: Mesh;
  logo: Mesh | null;
  shard: Shard;
  delay: number;
  vx: number;
  vy: number;
  vz: number;
  wx: number;
  wy: number;
  wz: number;
  live: boolean;
  gone: boolean;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Desenha o logo (letras e pirâmide) numa textura transparente. Devolve também onde ele fica na tela. */
async function drawLogo(w: number, h: number) {
  try {
    await document.fonts.load('300 100px "Cormorant Garamond"');
  } catch {
    /* sem a fonte, cai na serifada do sistema */
  }
  const fs = Math.min(136, Math.max(54.4, w * 0.13));
  const track = fs * 0.06;
  const pyW = fs * 0.82;
  const pyH = fs * 0.63;
  const pyGap = fs * 0.05;
  const family = '"Cormorant Garamond", Georgia, serif';

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `300 ${fs}px ${family}`;
  const advance = (t: string) => [...t].reduce((s, c) => s + measure.measureText(c).width + track, 0);
  const gl = advance("GL");
  const ss = advance("SS");
  const total = gl + pyGap + pyW + pyGap + ss;

  const pad = fs * 0.5;
  const lw = Math.ceil(total + pad * 2);
  const lh = Math.ceil(fs + pad * 2);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = lw * scale;
  canvas.height = lh * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.font = `300 ${fs}px ${family}`;
  ctx.textBaseline = "alphabetic";
  const baseline = pad + fs * 0.72;

  const glyphs = (text: string, x0: number) => {
    let x = x0;
    for (const c of text) {
      ctx.fillText(c, x, baseline);
      x += ctx.measureText(c).width + track;
    }
  };

  ctx.shadowColor = "rgba(127,227,255,0.9)";
  ctx.shadowBlur = fs * 0.12;
  ctx.fillStyle = "#f2f5fb";
  glyphs("GL", pad);
  glyphs("SS", pad + gl + pyGap + pyW + pyGap);

  // pirâmide: cinco triângulos que se abrem em leque, em cromo
  const px = pad + gl + pyGap;
  const py = baseline - pyH;
  const grad = ctx.createLinearGradient(px, py, px + pyW, py + pyH);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.35, "#8da0b4");
  grad.addColorStop(0.6, "#eaf4fb");
  grad.addColorStop(1, "#6d7c8c");
  ctx.strokeStyle = grad;
  ctx.lineWidth = Math.max(1.5, fs * 0.022);
  ctx.lineJoin = "round";
  const base: [number, number][] = [
    [0.04, 1],
    [0.5, 0],
    [0.96, 1],
  ];
  [1, 0.79, 0.59, 0.41, 0.25].forEach((s, i) => {
    ctx.globalAlpha = 1 - i * 0.07;
    ctx.beginPath();
    base.forEach(([bx, by], n) => {
      const x = px + (0.96 + (bx - 0.96) * s) * pyW;
      const y = py + (1 + (by - 1) * s) * pyH;
      if (n === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  // o logo fica centralizado, um pouco acima do meio: o centro das maiúsculas fica em 46% da altura
  const x0 = w / 2 - lw / 2;
  const y0 = h * 0.46 + pyH / 2 - baseline;
  return { texture, x0, y0, w: lw, h: lh };
}

/**
 * Cena 3D do vidro quebrando: uma placa de vidro com espessura, câmera em perspectiva, reflexos de ambiente
 * e física de queda. O logo está gravado no vidro e quebra junto.
 */
export async function createGlassScene(
  host: HTMLElement,
  w: number,
  h: number,
  fracture: Fracture,
  impactAt: { x: number; y: number },
): Promise<GlassScene> {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const el = renderer.domElement;
  el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  host.appendChild(el);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.6;

  const camDist = h / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
  const camera = new PerspectiveCamera(FOV, w / h, 20, camDist * 4);
  camera.position.set(0, 0, camDist);

  scene.add(new AmbientLight(0x6f8fb5, 0.12));
  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(-700, 800, 900);
  const fill = new DirectionalLight(0x8fd0ff, 1.5);
  fill.position.set(900, -300, 700);
  const rim = new DirectionalLight(0xffb0e8, 1.1);
  rim.position.set(300, 500, -400);
  scene.add(key, fill, rim);

  const glass = (color: number, opacity: number) =>
    new MeshStandardMaterial({
      color,
      metalness: 0,
      roughness: 0.02,
      envMapIntensity: 3.2,
      transparent: true,
      opacity,
      side: DoubleSide,
      depthWrite: false,
    });
  const faceMat = glass(0x142133, 0);
  const edgeMat = glass(0x9fe6ff, 0);
  const chipMat = glass(0xe6f6ff, 0.9);

  const logo = await drawLogo(w, h);
  const logoMat = new MeshBasicMaterial({ map: logo.texture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const logoZ = THICKNESS / 2 + 0.8;

  const world = new Group();
  scene.add(world);

  // antes da pancada: uma placa inteira, sem emendas
  const pane = new Group();
  const slab = new Mesh(new BoxGeometry(w * 1.02, h * 1.02, THICKNESS), [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat]);
  const paneLogo = new Mesh(new PlaneGeometry(logo.w, logo.h), logoMat);
  paneLogo.position.set(logo.x0 + logo.w / 2 - w / 2, h / 2 - (logo.y0 + logo.h / 2), logoZ);
  pane.add(slab, paneLogo);
  world.add(pane);

  // depois da pancada: os cacos, cada um uma placa com espessura
  const shardsGroup = new Group();
  shardsGroup.visible = false;
  world.add(shardsGroup);

  const bodies: Body[] = fracture.shards.map((shard) => {
    const local = shard.points.map((p) => new Vector2(p[0] - shard.cx, shard.cy - p[1]));
    const shape = new Shape(local);
    const geo = new ExtrudeGeometry(shape, { depth: THICKNESS, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.7, bevelSegments: 1 });
    geo.translate(0, 0, -THICKNESS / 2);
    const mesh = new Mesh(geo, [faceMat, edgeMat]);
    mesh.position.set(shard.cx - w / 2, h / 2 - shard.cy, 0);

    // só os cacos que pegam o logo levam um pedaço dele
    let piece: Mesh | null = null;
    const hit = shard.x < logo.x0 + logo.w && shard.x + shard.w > logo.x0 && shard.y < logo.y0 + logo.h && shard.y + shard.h > logo.y0;
    if (hit) {
      const sg: BufferGeometry = new ShapeGeometry(shape);
      const pos = sg.getAttribute("position");
      const uv: number[] = [];
      for (let i = 0; i < pos.count; i++) {
        const sx = pos.getX(i) + shard.cx;
        const sy = shard.cy - pos.getY(i);
        uv.push((sx - logo.x0) / logo.w, 1 - (sy - logo.y0) / logo.h);
      }
      sg.setAttribute("uv", new Float32BufferAttribute(uv, 2));
      piece = new Mesh(sg, logoMat);
      piece.position.z = logoZ;
      mesh.add(piece);
    }
    shardsGroup.add(mesh);
    return { mesh, logo: piece, shard, delay: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, live: false, gone: false };
  });

  // lascas pequenas que saltam do ponto de impacto
  const chips: Body[] = fracture.chips.map((shard) => {
    const shape = new Shape(shard.points.map((p) => new Vector2(p[0] - shard.cx, shard.cy - p[1])));
    const geo = new ExtrudeGeometry(shape, { depth: THICKNESS * 0.7, bevelEnabled: false });
    geo.translate(0, 0, -THICKNESS * 0.35);
    const mesh = new Mesh(geo, chipMat);
    mesh.position.set(shard.cx - w / 2, h / 2 - shard.cy, 0);
    mesh.visible = false;
    shardsGroup.add(mesh);
    return { mesh, logo: null, shard, delay: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, live: false, gone: false };
  });

  // laço de desenho
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let disposed = false;
  let fade: { from: number; to: number; start: number; ms: number } | null = null;
  let impactAtT = -1;
  let released = false;
  let releaseT = 0;
  let resolveRelease: (() => void) | null = null;
  const ix = impactAt.x - w / 2;
  const iy = h / 2 - impactAt.y;

  const frame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    // um reflexo de luz atravessa o vidro: o ambiente gira devagar
    scene.environmentRotation.y = t * 0.5 - 0.6;
    world.rotation.y = Math.sin(t * 0.7) * 0.025;
    world.rotation.x = Math.cos(t * 0.5) * 0.012;

    if (fade) {
      const k = Math.min(1, (now - fade.start) / fade.ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = fade.from + (fade.to - fade.from) * e;
      faceMat.opacity = 0.34 * v;
      logoMat.opacity = v;
      if (k >= 1) fade = null;
    }

    // tremor de quem acabou de levar a pancada
    if (impactAtT >= 0 && !released) {
      const since = t - impactAtT;
      const amp = Math.max(0, 1 - since / 0.45);
      bodies.forEach((b) => {
        const near = 1 - b.shard.dist;
        b.mesh.position.z = Math.sin(since * 70 + b.shard.id) * near * 2.2 * amp;
        b.mesh.rotation.z = Math.sin(since * 55 + b.shard.id * 1.7) * 0.004 * amp;
      });
      edgeMat.opacity = Math.min(0.85, since * 4);
    }

    const stepBody = (b: Body, drag: number) => {
      if (!b.live || b.gone) return;
      if (t - releaseT < b.delay) return;
      b.vy -= GRAVITY * dt;
      const d = Math.pow(drag, dt * 60);
      b.vx *= d;
      b.vz *= d;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z = Math.min(camDist * 0.55, b.mesh.position.z + b.vz * dt);
      b.mesh.rotation.x += b.wx * dt;
      b.mesh.rotation.y += b.wy * dt;
      b.mesh.rotation.z += b.wz * dt;
      if (b.mesh.position.y < -h / 2 - 380) {
        b.gone = true;
        b.mesh.visible = false;
      }
    };

    if (released) {
      bodies.forEach((b) => stepBody(b, 0.995));
      chips.forEach((b) => stepBody(b, 0.992));
      const allGone = bodies.every((b) => b.gone) && chips.every((b) => b.gone || !b.live);
      if (allGone || t - releaseT > 4) {
        resolveRelease?.();
        resolveRelease = null;
      }
    } else if (impactAtT >= 0) {
      // as lascas saem na hora da pancada, antes de o resto do vidro cair
      chips.forEach((b) => stepBody(b, 0.992));
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    fadeIn(ms) {
      fade = { from: 0, to: 1, start: performance.now(), ms };
      edgeMat.opacity = 0;
    },
    impact() {
      if (impactAtT >= 0) return;
      impactAtT = t;
      pane.visible = false;
      shardsGroup.visible = true;
      // as lascas ganham velocidade para fora, com um impulso para a câmera
      chips.forEach((b) => {
        const ang = Math.atan2(b.shard.cy - impactAt.y, b.shard.cx - impactAt.x);
        const sp = rand(260, 780);
        b.vx = Math.cos(ang) * sp;
        b.vy = -Math.sin(ang) * sp + rand(60, 260);
        b.vz = rand(80, 520);
        b.wx = rand(-14, 14);
        b.wy = rand(-14, 14);
        b.wz = rand(-10, 10);
        b.delay = 0;
        b.live = true;
        b.mesh.visible = true;
      });
      releaseT = t;
    },
    release(fast) {
      const k = fast ? 0.6 : 1;
      released = true;
      releaseT = t;
      bodies.forEach((b) => {
        const near = 1 - b.shard.dist;
        const ux = b.shard.cx - w / 2 - ix;
        const uy = h / 2 - b.shard.cy - iy;
        const len = Math.hypot(ux, uy) || 1;
        const burst = near * near * 560 + rand(0, 60);
        b.vx = (ux / len) * burst + rand(-40, 40);
        b.vy = (uy / len) * burst * 0.5 + rand(-20, 70);
        b.vz = Math.pow(near, 1.4) * 760 + rand(-40, 120);
        const spin = 1 + near * 1.6;
        b.wx = rand(-3.6, 3.6) * spin;
        b.wy = rand(-3, 3) * spin;
        b.wz = rand(-1.8, 1.8) * spin;
        b.delay = (b.shard.dist * 0.28 + rand(0, 0.1)) * k;
        b.live = true;
      });
      return new Promise<void>((resolve) => {
        resolveRelease = resolve;
      });
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        if (o instanceof Mesh) o.geometry.dispose();
      });
      [faceMat, edgeMat, chipMat, logoMat].forEach((m) => m.dispose());
      logo.texture.dispose();
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      el.remove();
    },
  };
}
