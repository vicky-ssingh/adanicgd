import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useViewStore } from '@/state/useViewStore';
import { BRAND } from '@/theme/tokens';

/**
 * Procedural image-based lighting (spec §2.31). We prefilter a hand-authored
 * equirectangular canvas into an environment map with PMREMGenerator — giving
 * real PBR reflections/roughness response with NO downloaded HDRI (this sandbox
 * has no outbound network) and without drei's <Environment> (which crashes under
 * this Vite build). To use a real CC0 .hdr later, load it with RGBELoader and
 * feed pmrem.fromEquirectangular(hdrTexture) here — this is the only touch point.
 */

function radialGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const c = new THREE.Color(color);
  g.addColorStop(0, `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${alpha})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function makeEquirect(day: boolean): HTMLCanvasElement {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (day) {
    // Shantigram clear blue sky with warm horizon (addon §6)
    grad.addColorStop(0.0, '#4a8fcf'); // blue zenith
    grad.addColorStop(0.4, '#9cc4e4');
    grad.addColorStop(0.5, '#eaf1f7'); // bright warm horizon band
    grad.addColorStop(0.55, '#e0e8ef');
    grad.addColorStop(1.0, '#aeb4b8'); // ground bounce
  } else {
    grad.addColorStop(0.0, '#0a1626');
    grad.addColorStop(0.48, '#132840');
    grad.addColorStop(0.5, '#1b3a5a');
    grad.addColorStop(0.55, '#0f2338');
    grad.addColorStop(1.0, '#050b14');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (day) {
    // Warm sun disc + soft sky glow (clear-day specular interest)
    radialGlow(ctx, w * 0.7, h * 0.26, h * 0.22, '#fff6df', 0.85);
    radialGlow(ctx, w * 0.7, h * 0.26, h * 0.5, '#ffe9c2', 0.3);
    radialGlow(ctx, w * 0.2, h * 0.4, h * 0.4, '#cfe3f4', 0.22);
  } else {
    // Practical brand accents so night reflections aren't dead
    radialGlow(ctx, w * 0.3, h * 0.62, h * 0.25, BRAND.primary, 0.5);
    radialGlow(ctx, w * 0.7, h * 0.6, h * 0.22, BRAND.tealCng, 0.45);
    radialGlow(ctx, w * 0.5, h * 0.66, h * 0.2, '#ffce8a', 0.4);
    radialGlow(ctx, w * 0.88, h * 0.58, h * 0.18, BRAND.violetPng, 0.35);
  }

  return canvas;
}

export function SceneEnvironment() {
  const { gl, scene } = useThree();
  const day = useViewStore((s) => s.timeOfDay) === 'day';

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const tex = new THREE.CanvasTexture(makeEquirect(day));
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    const rt = pmrem.fromEquirectangular(tex);
    scene.environment = rt.texture;

    return () => {
      scene.environment = null;
      rt.dispose();
      tex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, day]);

  return null;
}
