import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useViewStore } from '@/state/useViewStore';

interface Tween {
  posFrom: THREE.Vector3;
  posTo: THREE.Vector3;
  tgtFrom: THREE.Vector3;
  tgtTo: THREE.Vector3;
  start: number;
  dur: number;
  nonce: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Smoothly flies the camera + OrbitControls target to the active focus request
 * (camera presets §2.29, focus-on-selected §2.24). While a tween runs it drives
 * the controls target each frame; when done it hands control back to the user.
 */
export function CameraRig() {
  const focus = useViewStore((s) => s.focus);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | { target: THREE.Vector3; update: () => void }
    | null;
  const tween = useRef<Tween | null>(null);
  const lastNonce = useRef<number>(-1);

  useEffect(() => {
    if (!focus || !controls) return;
    if (focus.nonce === lastNonce.current) return;
    lastNonce.current = focus.nonce;
    tween.current = {
      posFrom: camera.position.clone(),
      posTo: new THREE.Vector3(...focus.position),
      tgtFrom: controls.target.clone(),
      tgtTo: new THREE.Vector3(...focus.target),
      start: performance.now(),
      dur: 1100,
      nonce: focus.nonce,
    };
  }, [focus, camera, controls]);

  useFrame(() => {
    const tw = tween.current;
    if (!tw || !controls) return;
    const raw = Math.min(1, (performance.now() - tw.start) / tw.dur);
    const t = easeInOut(raw);
    camera.position.lerpVectors(tw.posFrom, tw.posTo, t);
    controls.target.lerpVectors(tw.tgtFrom, tw.tgtTo, t);
    controls.update();
    if (raw >= 1) tween.current = null;
  });

  return null;
}
