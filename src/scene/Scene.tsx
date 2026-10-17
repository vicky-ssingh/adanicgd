import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { SceneEnvironment } from './SceneEnvironment';
import { GradientSky } from './GradientSky';
import { Lighting } from './Lighting';
import { PostProcessing } from './PostProcessing';
import { City } from '@/components3d/city/City';
import { Shantigram } from '@/components3d/shantigram/Shantigram';
import { CgdNetwork } from '@/components3d/infrastructure/CgdNetwork';
import { SvNetwork } from '@/components3d/infrastructure/SvNetwork';
import { RouteMarkers } from '@/components3d/infrastructure/RouteMarkers';
import { PigNetwork } from '@/components3d/infrastructure/PigNetwork';
import { SafetySystems } from '@/components3d/safety/SafetySystems';
import { ScadaSystems } from '@/components3d/scada/ScadaSystems';
import { CngNetwork } from '@/components3d/cng/CngNetwork';
import { MotherNetwork } from '@/components3d/cng/MotherNetwork';
import { TrailerFleet } from '@/components3d/cng/TrailerFleet';
import { DaughterNetwork } from '@/components3d/cng/DaughterNetwork';
import { PngNetwork } from '@/components3d/png/PngNetwork';
import { FlowParticles } from '@/components3d/flow/FlowParticles';
import { ConnectionDots } from '@/components3d/flow/ConnectionDots';
import { WallServiceFlow } from '@/components3d/png/WallServiceFlow';
import { PngConsumers } from '@/components3d/png/consumers/PngConsumers';
import { SimulationRunner } from './SimulationRunner';
import { CameraRig } from './CameraRig';
import { TourDirector } from './TourDirector';
import { StatusIndicators } from '@/components3d/StatusIndicators';
import { TourLabels } from '@/components3d/TourLabels';
import { ExclusionMaskOverlay } from '@/components3d/ExclusionMaskOverlay';
import { PerfMonitor } from '@/components3d/PerfMonitor';
import { GroundCutaway } from '@/components3d/infrastructure/GroundCutaway';
import { PipeCutaways } from '@/components3d/infrastructure/PipeCutaways';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useMeterStore } from '@/state/useMeterStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useOdorStore } from '@/state/useOdorStore';
import { useSvStore } from '@/state/useSvStore';
import { useValveStore } from '@/state/useValveStore';
import { useMarkerStore } from '@/state/useMarkerStore';
import { usePigStore } from '@/state/usePigStore';
import { useEsdStore } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { useCpStore } from '@/state/useCpStore';
import { useScadaStore } from '@/state/useScadaStore';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { useTourStore } from '@/state/useTourStore';
import { useViewStore } from '@/state/useViewStore';
import { useSettingsStore, QUALITY } from '@/state/useSettingsStore';

/**
 * Scene root. M1 realism gate: procedural overcast IBL + gradient sky + soft
 * key lighting + SSAO/Bloom/SMAA post-processing + ACES tone mapping, validated
 * against the §1 daylight benchmark. M2+ populate the full city and CGD network.
 */
export function Scene() {
  const clearSelection = useSelectionStore((s) => s.clear);
  const clearRoute = useRouteStore((s) => s.clear);
  const clearMeter = useMeterStore((s) => s.close);
  const clearStationInfo = useStationInfoStore((s) => s.close);
  const clearMotherInfo = useMotherInfoStore((s) => s.close);
  const clearTrailerInfo = useTrailerInfoStore((s) => s.close);
  const clearDaughterInfo = useDaughterInfoStore((s) => s.close);
  const clearOdorInfo = useOdorStore((s) => s.close);
  const clearSvPanel = useSvStore((s) => s.closePanel);
  const clearMarker = useMarkerStore((s) => s.close);
  const clearPigPanel = usePigStore((s) => s.closePanel);
  const clearEsdPanel = useEsdStore((s) => s.closePanel);
  const clearGasPanel = useGasStore((s) => s.closePanel);
  const clearCpInfo = useCpStore((s) => s.closeInfo);
  const clearRtu = useScadaStore((s) => s.closeRtu);
  const clearCentre = useScadaStore((s) => s.closeCentre);
  const clearConsumer = usePngConsumerStore((s) => s.closePanel);
  const tourActive = useTourStore((s) => s.active);
  const presentation = useViewStore((s) => s.presentation);
  const lockCamera = tourActive && presentation; // §D.5 disable accidental input
  const q = QUALITY[useSettingsStore((s) => s.quality)];
  return (
    <Canvas
      shadows
      dpr={q.dpr}
      onPointerMissed={() => {
        clearSelection();
        clearRoute();
        clearMeter();
        clearStationInfo();
        clearMotherInfo();
        clearTrailerInfo();
        clearDaughterInfo();
        clearOdorInfo();
        clearSvPanel();
        clearMarker();
        clearPigPanel();
        clearEsdPanel();
        clearGasPanel();
        clearCpInfo();
        clearRtu();
        clearCentre();
        clearConsumer();
        useValveStore.getState().closePanel();
      }}
      camera={{ position: [95, 68, 118], fov: 42, near: 0.1, far: 1200 }}
      gl={{
        antialias: false, // SMAA handles AA in the post stack
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        powerPreference: 'high-performance',
      }}
    >
      <Suspense fallback={null}>
        <SceneEnvironment />
        <GradientSky />
        <Lighting />

        <City />
        <Shantigram />
        <CgdNetwork />
        <SvNetwork />
        <RouteMarkers />
        <PigNetwork />
        <SafetySystems />
        <ScadaSystems />
        <CngNetwork />
        <MotherNetwork />
        <TrailerFleet />
        <DaughterNetwork />
        <PngNetwork />
        <FlowParticles />
        <ConnectionDots />
        <WallServiceFlow />
        <PngConsumers />
        <StatusIndicators />
        <TourLabels />
        <ExclusionMaskOverlay />
        <PerfMonitor />
        <GroundCutaway />
        <PipeCutaways />
        <SimulationRunner />
        <CameraRig />
        <TourDirector />

        <ContactShadows
          key={q.contactRes}
          position={[0, 0.02, 0]}
          scale={260}
          resolution={q.contactRes}
          blur={2.8}
          opacity={0.42}
          far={30}
          frames={1}
        />

        <PostProcessing />
      </Suspense>

      <OrbitControls
        makeDefault
        enabled={!lockCamera}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={400}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 4, 0]}
      />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
