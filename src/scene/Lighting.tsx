import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useViewStore } from '@/state/useViewStore';
import { useSettingsStore, QUALITY } from '@/state/useSettingsStore';

/**
 * Direct lighting rig (spec §2.31 / §2.32). The IBL (SceneEnvironment) supplies
 * soft ambient + reflections; this adds a gentle key for contact shadows.
 * Day = single soft overcast key (no harsh sun) + hemisphere fill.
 * Night = dim moonlight key + cool hemisphere; practical lights live on assets.
 *
 * Section 11 §C.4 — the day↔night change now CROSS-FADES over ~2.5 s (light
 * intensities, colours, key direction and fog all interpolate) instead of
 * snapping. The steady-state day and night values are unchanged, so nothing looks
 * different at rest — only the transition is smooth.
 */
const DAY = {
  hemiSky: new THREE.Color('#d3e6f7'), hemiGround: new THREE.Color('#9a9280'), hemiI: 0.7,
  keyPos: new THREE.Vector3(70, 96, 60), keyI: 2.0, keyCol: new THREE.Color('#fff1cf'),
  fillPos: new THREE.Vector3(-16, 10, -10), fillI: 0.25, fillCol: new THREE.Color('#dbe6f0'),
  fogCol: new THREE.Color('#cfe0ee'), fogNear: 240, fogFar: 760,
};
const NIGHT = {
  hemiSky: new THREE.Color('#2b415e'), hemiGround: new THREE.Color('#0a1220'), hemiI: 0.35,
  keyPos: new THREE.Vector3(-70, 100, -45), keyI: 0.4, keyCol: new THREE.Color('#9fc0e6'),
  fillPos: new THREE.Vector3(10, 8, 10), fillI: 0.12, fillCol: new THREE.Color('#3a5a80'),
  fogCol: new THREE.Color('#0a1523'), fogNear: 130, fogFar: 520,
};

export function Lighting() {
  const timeOfDay = useViewStore((s) => s.timeOfDay);
  const day = timeOfDay === 'day';
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);
  const shadowMap = QUALITY[useSettingsStore((s) => s.quality)].shadowMap;
  const p = useRef(day ? 1 : 0); // 1 = day, 0 = night

  const fog = useMemo(() => new THREE.Fog('#cfe0ee', 240, 760), []);
  useEffect(() => {
    scene.fog = fog;
    return () => { scene.fog = null; };
  }, [scene, fog]);

  useFrame((_, dt) => {
    const target = day ? 1 : 0;
    // ease toward the target (~2.5 s, ease-out)
    p.current += (target - p.current) * Math.min(1, dt * 0.9);
    const t = p.current;
    const lerpC = (a: THREE.Color, b: THREE.Color, out: THREE.Color) => out.copy(a).lerp(b, t); // night→day

    const hemi = hemiRef.current, key = keyRef.current, fill = fillRef.current;
    if (hemi) {
      lerpC(NIGHT.hemiSky, DAY.hemiSky, hemi.color);
      lerpC(NIGHT.hemiGround, DAY.hemiGround, hemi.groundColor);
      hemi.intensity = THREE.MathUtils.lerp(NIGHT.hemiI, DAY.hemiI, t);
    }
    if (key) {
      key.position.lerpVectors(NIGHT.keyPos, DAY.keyPos, t);
      key.intensity = THREE.MathUtils.lerp(NIGHT.keyI, DAY.keyI, t);
      lerpC(NIGHT.keyCol, DAY.keyCol, key.color);
    }
    if (fill) {
      fill.position.lerpVectors(NIGHT.fillPos, DAY.fillPos, t);
      fill.intensity = THREE.MathUtils.lerp(NIGHT.fillI, DAY.fillI, t);
      lerpC(NIGHT.fillCol, DAY.fillCol, fill.color);
    }
    fog.color.copy(NIGHT.fogCol).lerp(DAY.fogCol, t);
    fog.near = THREE.MathUtils.lerp(NIGHT.fogNear, DAY.fogNear, t);
    fog.far = THREE.MathUtils.lerp(NIGHT.fogFar, DAY.fogFar, t);
  });

  return (
    <group>
      <hemisphereLight ref={hemiRef} args={['#d3e6f7', '#9a9280', 0.7]} />
      <directionalLight
        ref={keyRef}
        position={[70, 96, 60]}
        intensity={2.0}
        color={'#fff1cf'}
        castShadow
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
      >
        <orthographicCamera attach="shadow-camera" args={[-120, 120, 120, -120, 0.1, 400]} />
      </directionalLight>
      {/* Soft opposite fill to lift shadow bottoms (kept low for realism) */}
      <directionalLight ref={fillRef} position={[-16, 10, -10]} intensity={0.25} color={'#dbe6f0'} />
    </group>
  );
}
