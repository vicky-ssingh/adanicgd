import { useMemo } from 'react';
import * as THREE from 'three';
import { useViewStore } from '@/state/useViewStore';

/**
 * Procedural gradient sky dome (spec §1 overcast daylight / §2.32 night).
 * No external HDRI required — a large back-side sphere with a vertical gradient
 * shader. Day = soft diffuse overcast; Night = deep navy with horizon glow.
 */
const vert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  void main() {
    float h = normalize(vWorld).y;
    vec3 col = h > 0.0
      ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55))
      : mix(uHorizon, uBottom, clamp(-h, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function GradientSky() {
  const timeOfDay = useViewStore((s) => s.timeOfDay);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTop: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uBottom: { value: new THREE.Color() },
      },
    });
  }, []);

  useMemo(() => {
    const u = material.uniforms;
    if (timeOfDay === 'day') {
      // Shantigram: clear, bright Ahmedabad-style blue sky (addon §6)
      u.uTop.value.set('#3f86c9');
      u.uHorizon.value.set('#cfe3f2');
      u.uBottom.value.set('#b9c6d0');
    } else {
      u.uTop.value.set('#0a1a30');
      u.uHorizon.value.set('#16324f');
      u.uBottom.value.set('#060d18');
    }
  }, [material, timeOfDay]);

  return (
    <mesh scale={[300, 300, 300]}>
      <sphereGeometry args={[1, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
