import * as THREE from 'three';

/**
 * Canvas-generated PBR detail textures (spec §2.30). Because this environment
 * has no outbound network to fetch CC0 texture sets, we synthesise subtle
 * surface variation (roughness / AO / normal / paint mottling) procedurally so
 * major infrastructure never reads as a flat single-color material.
 *
 * All generators are memoised — the same logical texture is created once and
 * reused across every material that requests it (keeps GPU memory low).
 */

const cache = new Map<string, THREE.Texture>();

function makeCanvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

/** Deterministic pseudo-random (so results are stable across reloads). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value-noise heightfield with fractal octaves, returned as a Float array. */
function valueNoiseField(size: number, seed: number, octaves = 5): Float32Array {
  const rand = mulberry32(seed);
  const field = new Float32Array(size * size);
  let amp = 1;
  let ampSum = 0;
  for (let o = 0; o < octaves; o++) {
    const cells = Math.max(2, Math.floor(size / (2 ** (octaves - o))));
    const grid = new Float32Array((cells + 1) * (cells + 1));
    for (let i = 0; i < grid.length; i++) grid[i] = rand();
    const scale = size / cells;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x / scale;
        const gy = y / scale;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const v00 = grid[y0 * (cells + 1) + x0];
        const v10 = grid[y0 * (cells + 1) + x0 + 1];
        const v01 = grid[(y0 + 1) * (cells + 1) + x0];
        const v11 = grid[(y0 + 1) * (cells + 1) + x0 + 1];
        const top = v00 + (v10 - v00) * sx;
        const bot = v01 + (v11 - v01) * sx;
        field[y * size + x] += (top + (bot - top) * sy) * amp;
      }
    }
    ampSum += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < field.length; i++) field[i] /= ampSum;
  return field;
}

/** Grayscale roughness/AO map from fractal noise. */
export function roughnessMap(seed = 1, size = 256, contrast = 0.5): THREE.Texture {
  const key = `rough-${seed}-${size}-${contrast}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const field = valueNoiseField(size, seed);
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < field.length; i++) {
    const v = 0.5 + (field[i] - 0.5) * contrast;
    const c = Math.max(0, Math.min(255, Math.floor(v * 255)));
    img.data[i * 4] = c;
    img.data[i * 4 + 1] = c;
    img.data[i * 4 + 2] = c;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Tangent-space normal map derived from a noise heightfield (subtle bumps). */
export function normalMap(seed = 2, size = 256, strength = 1.4): THREE.Texture {
  const key = `normal-${seed}-${size}-${strength}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const h = valueNoiseField(size, seed, 6);
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const nz = 1;
      const len = Math.hypot(dx, dy, nz) || 1;
      const i = (y * size + x) * 4;
      img.data[i] = Math.floor(((dx / len) * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.floor(((dy / len) * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Mottled color map (concrete / painted metal weathering) around a base hue. */
export function mottleMap(
  base: string,
  seed = 3,
  size = 256,
  amount = 0.12,
): THREE.Texture {
  const key = `mottle-${base}-${seed}-${size}-${amount}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const field = valueNoiseField(size, seed, 5);
  const dirt = valueNoiseField(size, seed + 99, 6);
  const col = new THREE.Color(base);
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < field.length; i++) {
    const shade = 1 + (field[i] - 0.5) * amount * 2;
    const grime = 1 - Math.max(0, dirt[i] - 0.62) * 0.5;
    const r = Math.min(255, col.r * 255 * shade * grime);
    const g = Math.min(255, col.g * 255 * shade * grime);
    const b = Math.min(255, col.b * 255 * shade * grime);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export interface FacadeOptions {
  wall: string;
  frame: string;
  glass: string;
  cols: number;
  rows: number;
  seed?: number;
  /** fraction of window cell taken by glazing */
  glazing?: number;
}

/**
 * Building facade: floors of windows with mullions/frames over a wall color.
 * Returns { map } (albedo) and { light } (emissive lit-window mask for night).
 */
export function facadeMap(opts: FacadeOptions): {
  map: THREE.Texture;
  light: THREE.Texture;
} {
  const { wall, frame, glass: glassC, cols, rows, seed = 1, glazing = 0.62 } = opts;
  const key = `facade-${wall}-${frame}-${glassC}-${cols}-${rows}-${seed}-${glazing}`;
  const hitMap = cache.get(key + '-map');
  const hitLight = cache.get(key + '-light');
  if (hitMap && hitLight) return { map: hitMap, light: hitLight };

  const W = 256;
  const H = Math.max(64, Math.min(512, Math.round((256 / cols) * rows)));
  const canvas = makeCanvas(W);
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(seed);

  // Wall base with faint vertical shading
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, 'rgba(255,255,255,0.05)');
  grd.addColorStop(1, 'rgba(0,0,0,0.10)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  const cw = W / cols;
  const ch = H / rows;
  const gw = cw * glazing;
  const gh = ch * glazing;

  // Light canvas (black, lit windows drawn white-ish)
  const lightCanvas = makeCanvas(W);
  lightCanvas.height = H;
  const lctx = lightCanvas.getContext('2d')!;
  lctx.fillStyle = '#000';
  lctx.fillRect(0, 0, W, H);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + (cw - gw) / 2;
      const y = r * ch + (ch - gh) / 2;
      // frame
      ctx.fillStyle = frame;
      ctx.fillRect(x - 2, y - 2, gw + 4, gh + 4);
      // glass with slight per-window variation
      const v = 0.85 + rand() * 0.3;
      const gc = new THREE.Color(glassC).multiplyScalar(v);
      ctx.fillStyle = `rgb(${gc.r * 255 | 0},${gc.g * 255 | 0},${gc.b * 255 | 0})`;
      ctx.fillRect(x, y, gw, gh);
      // mullion
      ctx.strokeStyle = frame;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + gw / 2, y);
      ctx.lineTo(x + gw / 2, y + gh);
      ctx.moveTo(x, y + gh / 2);
      ctx.lineTo(x + gw, y + gh / 2);
      ctx.stroke();
      // lit windows at night (random subset)
      if (rand() > 0.62) {
        const warm = 200 + (rand() * 55) | 0;
        lctx.fillStyle = `rgb(${warm},${(warm * 0.82) | 0},${(warm * 0.55) | 0})`;
        lctx.fillRect(x, y, gw, gh);
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  const light = new THREE.CanvasTexture(lightCanvas);
  light.colorSpace = THREE.SRGBColorSpace;
  light.anisotropy = 8;
  light.wrapS = light.wrapT = THREE.ClampToEdgeWrapping;

  cache.set(key + '-map', map);
  cache.set(key + '-light', light);
  return { map, light };
}

export function disposeTextureCache() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
