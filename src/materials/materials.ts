import * as THREE from 'three';
import { roughnessMap, normalMap, mottleMap } from './proceduralTextures';

/**
 * Central PBR material factory (spec §2.30 / §2.36). Every major asset pulls its
 * material from here so surface response is consistent and never a flat single
 * color. Materials are memoised by key. Brand/emissive colors always come from
 * the theme tokens — never hard-coded here (see src/theme/tokens.ts).
 */

const materials = new Map<string, THREE.Material>();

function repeat(tex: THREE.Texture, r: number) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(r, r);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export interface MetalOptions {
  color?: string;
  roughness?: number;
  metalness?: number;
  repeatN?: number;
  seed?: number;
}

/** Galvanised / painted steel with roughness + micro-normal variation. */
export function steel(opts: MetalOptions = {}): THREE.MeshStandardMaterial {
  const { color = '#b8bdc4', roughness = 0.45, metalness = 0.9, repeatN = 2, seed = 1 } =
    opts;
  const key = `steel-${color}-${roughness}-${metalness}-${repeatN}-${seed}`;
  const hit = materials.get(key) as THREE.MeshStandardMaterial;
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    roughnessMap: repeat(roughnessMap(seed, 256, 0.7), repeatN),
    normalMap: repeat(normalMap(seed + 10, 256, 0.6), repeatN),
    normalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 1.0,
  });
  materials.set(key, m);
  return m;
}

/** Painted equipment metal (matte, more saturated) — cabinets, frames, skids. */
export function paintedMetal(color: string, seed = 4): THREE.MeshStandardMaterial {
  const key = `paint-${color}-${seed}`;
  const hit = materials.get(key) as THREE.MeshStandardMaterial;
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    map: repeat(mottleMap(color, seed, 256, 0.08), 1.5),
    roughness: 0.55,
    metalness: 0.35,
    roughnessMap: repeat(roughnessMap(seed + 5, 256, 0.5), 2),
    normalMap: repeat(normalMap(seed + 15, 256, 0.4), 2),
    normalScale: new THREE.Vector2(0.2, 0.2),
    envMapIntensity: 0.8,
  });
  materials.set(key, m);
  return m;
}

/** Concrete foundation / pad / kerb. */
export function concrete(color = '#9a9791', seed = 7): THREE.MeshStandardMaterial {
  const key = `concrete-${color}-${seed}`;
  const hit = materials.get(key) as THREE.MeshStandardMaterial;
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    map: repeat(mottleMap(color, seed, 256, 0.16), 3),
    roughness: 0.95,
    metalness: 0,
    roughnessMap: repeat(roughnessMap(seed + 3, 256, 0.6), 3),
    normalMap: repeat(normalMap(seed + 8, 256, 1.0), 3),
    normalScale: new THREE.Vector2(0.5, 0.5),
    envMapIntensity: 0.6,
  });
  materials.set(key, m);
  return m;
}

/** Asphalt road surface. */
export function asphalt(seed = 30): THREE.MeshStandardMaterial {
  const key = `asphalt-${seed}`;
  const hit = materials.get(key) as THREE.MeshStandardMaterial;
  if (hit) return hit;
  const rough = roughnessMap(seed, 256, 0.6);
  const norm = normalMap(seed + 4, 256, 0.7);
  const m = new THREE.MeshStandardMaterial({
    color: '#6b6f76', // Shantigram: clean, well-maintained light-grey asphalt (addon §6)
    roughness: 0.9,
    metalness: 0,
    roughnessMap: rough,
    normalMap: norm,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 0.4,
  });
  materials.set(key, m);
  return m;
}

/** Glass curtain-wall / window glazing. */
export function glass(color = '#9fc4d8', tint = 0.15): THREE.MeshPhysicalMaterial {
  const key = `glass-${color}-${tint}`;
  const hit = materials.get(key) as THREE.MeshPhysicalMaterial;
  if (hit) return hit;
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.08,
    metalness: 0,
    transmission: 0,
    reflectivity: 0.6,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.3,
    opacity: 1 - tint,
  });
  materials.set(key, m);
  return m;
}

/** Emissive brand-glow material (status strips, signage, flow accents). */
export function emissive(color: string, intensity = 1.2): THREE.MeshStandardMaterial {
  const key = `emissive-${color}-${intensity}`;
  const hit = materials.get(key) as THREE.MeshStandardMaterial;
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    color: '#0a0a0a',
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.5,
    metalness: 0,
  });
  materials.set(key, m);
  return m;
}

export function disposeMaterialCache() {
  materials.forEach((m) => m.dispose());
  materials.clear();
}
