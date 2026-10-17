import { useMemo } from 'react';
import {
  EffectComposer,
  Bloom,
  SSAO,
  SMAA,
  Vignette,
  BrightnessContrast,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useViewStore } from '@/state/useViewStore';
import { useSettingsStore, QUALITY } from '@/state/useSettingsStore';

/**
 * Post-processing stack (spec §1 / §2.31). MSAA + SSAO for clean occlusion,
 * Bloom for brand emissive glow, SMAA, and a restrained vignette. Effect cost
 * scales with the selected quality preset (SSAO/MSAA drop on Low).
 */
export function PostProcessing() {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const quality = useSettingsStore((s) => s.quality);
  const q = QUALITY[quality];

  return useMemo(
    () => (
      <EffectComposer multisampling={q.msaa} enableNormalPass={q.ssao}>
        {q.ssao ? (
          <SSAO
            blendFunction={BlendFunction.MULTIPLY}
            samples={q.ssaoSamples}
            rings={4}
            radius={0.14}
            intensity={7}
            luminanceInfluence={0.7}
            bias={0.05}
            fade={0.02}
            worldDistanceThreshold={40}
            worldDistanceFalloff={8}
            worldProximityThreshold={6}
            worldProximityFalloff={2}
          />
        ) : (
          <></>
        )}
        <Bloom
          intensity={night ? 0.9 : 0.45}
          luminanceThreshold={night ? 0.35 : 0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <BrightnessContrast brightness={0} contrast={night ? 0.05 : 0.02} />
        <Vignette eskil={false} offset={0.28} darkness={night ? 0.55 : 0.32} />
        <SMAA />
      </EffectComposer>
    ),
    [night, q.msaa, q.ssao, q.ssaoSamples],
  );
}
