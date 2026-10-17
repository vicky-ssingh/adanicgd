import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { SignPlane } from '@/components3d/branding/Branding';
import { RTUS, CONTROL_CENTRE, rtuLinkOrigin, type CommsStatus } from '@/config/scadaLayout';

/**
 * Section 09 §5 — the SCADA telemetry overlay. When enabled it draws, above the
 * live 3D scene: a thin animated dashed link from every RTU arcing to the control
 * centre; bright data packets travelling those links at the polling cycle; a soft
 * colour-coded status ring hovering over each RTU; a larger ring over the control
 * centre with an arrival pulse; and a "15 RTU CONNECTED" billboard. RTU-09 is
 * degraded — amber ring, slower packets that occasionally drop mid-journey.
 * Deliberately subtle (blue, low opacity) so it never obscures the scene.
 */
const LINK = new THREE.Color('#0B74B0');
const PACKET = new THREE.Color('#4DB8FF');
const RING: Record<CommsStatus, THREE.Color> = {
  online: new THREE.Color('#39d98a'),
  degraded: new THREE.Color('#ffb020'),
  lost: new THREE.Color('#ff3b3b'),
};

function makeDashTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 4;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 32, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 16, 4); // 50% duty dash
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

interface Link {
  curve: THREE.CatmullRomCurve3;
  geom: THREE.TubeGeometry;
  mat: THREE.MeshBasicMaterial;
  phase: number;
  status: CommsStatus;
}

export function ScadaLayer() {
  const { camera } = useThree();
  const packetsRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const arrivalRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);

  const links = useMemo<Link[]>(() => {
    const end = new THREE.Vector3(CONTROL_CENTRE.pos[0], CONTROL_CENTRE.ringY, CONTROL_CENTRE.pos[1]);
    return RTUS.map((r, i) => {
      const [ox, oy, oz] = rtuLinkOrigin(r);
      const origin = new THREE.Vector3(ox, oy, oz);
      const rise = new THREE.Vector3(ox, oy + 2, oz);
      const mid = new THREE.Vector3((ox + end.x) / 2, Math.max(oy, end.y) + 7, (oz + end.z) / 2);
      const curve = new THREE.CatmullRomCurve3([origin, rise, mid, end.clone()]);
      const geom = new THREE.TubeGeometry(curve, 48, 0.09, 6, false);
      const tex = makeDashTexture();
      tex.repeat.set(Math.max(6, curve.getLength() * 0.9), 1);
      const mat = new THREE.MeshBasicMaterial({ color: LINK, map: tex, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      return { curve, geom, mat, phase: i / RTUS.length, status: r.status };
    });
  }, []);

  const packetMat = useMemo(() => new THREE.MeshBasicMaterial({ color: PACKET, transparent: true, toneMapped: false, depthWrite: false }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Animate the dashed links flowing toward the control centre.
    for (const l of links) {
      if (l.mat.map) l.mat.map.offset.x = -(t * 0.35) % 1;
    }

    // Data packets.
    const grp = packetsRef.current;
    if (grp) {
      links.forEach((l, i) => {
        const packet = grp.children[i] as THREE.Mesh;
        const degraded = l.status === 'degraded';
        const rate = degraded ? 1 / 6 : 1 / 3; // one poll per 3 s (6 s when degraded)
        const raw = t * rate + l.phase;
        const frac = raw - Math.floor(raw);
        const p = l.curve.getPoint(frac);
        packet.position.copy(p);
        // occasional dropped packet on the degraded link (every other cycle, fades mid-way)
        let vis = 1;
        if (degraded && Math.floor(raw) % 2 === 1) vis = frac < 0.45 ? 1 - frac / 0.45 : 0;
        packet.scale.setScalar(0.25 * (0.7 + 0.3 * Math.sin(t * 8 + i)));
        (packet.material as THREE.MeshBasicMaterial).opacity = 0.9 * vis;
        packet.visible = vis > 0.02;
      });
    }

    // RTU status rings — gentle pulse.
    const rg = ringsRef.current;
    if (rg) {
      const pulse = 0.5 + Math.sin(t * 2.5) * 0.5;
      rg.children.forEach((ring) => {
        const m = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.35 + pulse * 0.4;
        const s = 1 + pulse * 0.14;
        ring.scale.set(s, s, s);
      });
    }

    // Control-centre arrival pulse (expands over the first second of each 3 s poll).
    const ar = arrivalRef.current;
    if (ar) {
      const ph = (t % 3) / 1;
      const on = ph <= 1;
      ar.visible = on;
      if (on) {
        const s = 1 + ph * 2.2;
        ar.scale.set(s, s, s);
        (ar.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ph);
      }
    }

    // Billboard the counter label toward the camera.
    if (labelRef.current) labelRef.current.quaternion.copy(camera.quaternion);
  });

  const onlineCount = RTUS.filter((r) => r.status !== 'lost').length;

  return (
    <group>
      {/* links */}
      {links.map((l, i) => (
        <mesh key={i} geometry={l.geom} material={l.mat} />
      ))}

      {/* data packets */}
      <group ref={packetsRef}>
        {RTUS.map((r) => (
          <mesh key={r.id} material={packetMat.clone()}>
            <sphereGeometry args={[1, 10, 10]} />
          </mesh>
        ))}
      </group>

      {/* RTU status rings */}
      <group ref={ringsRef}>
        {RTUS.map((r) => (
          <mesh key={r.id} position={[r.pos[0], 3.4, r.pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.42, 0.58, 28]} />
            <meshBasicMaterial color={RING[r.status]} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* control-centre ring + arrival pulse + counter */}
      <group position={[CONTROL_CENTRE.pos[0], CONTROL_CENTRE.ringY, CONTROL_CENTRE.pos[1]]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.8, 40]} />
          <meshBasicMaterial color={LINK} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh ref={arrivalRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.9, 40]} />
          <meshBasicMaterial color={PACKET} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
        <group ref={labelRef} position={[0, 2.2, 0]}>
          <SignPlane text={`${onlineCount} RTU CONNECTED`} width={5} options={{ fg: '#ffffff', bg: '#0B74B0', fontWeight: 800, letterSpacing: 1, radius: 6, paddingX: 14 }} doubleSide />
        </group>
      </group>
    </group>
  );
}
