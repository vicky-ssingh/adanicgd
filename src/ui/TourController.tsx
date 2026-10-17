import { useEffect, useRef } from 'react';
import { useTourStore } from '@/state/useTourStore';
import { useViewStore } from '@/state/useViewStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { TOUR, validateTourCoverage } from '@/config/tour';
import { applyStopAction, applyStopFraming, clearAllTourEffects } from '@/state/tourActions';
import { speak, cancelSpeech, speechSupported } from '@/utils/speech';
import { BRAND } from '@/theme/tokens';

/** Estimated narration time (ms) from word count at the TTS rate. */
function dwellFor(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(5000, Math.round(words * 380));
}

/**
 * Guided-tour orchestrator + UI (voice narration, subtitles, transport controls).
 * Always mounted; drives camera / mode / selection and speech when active.
 */
export function TourController() {
  const active = useTourStore((s) => s.active);
  const index = useTourStore((s) => s.index);
  const playing = useTourStore((s) => s.playing);
  const voiceEnabled = useTourStore((s) => s.voiceEnabled);
  const next = useTourStore((s) => s.next);
  const prev = useTourStore((s) => s.prev);
  const togglePlay = useTourStore((s) => s.togglePlay);
  const toggleVoice = useTourStore((s) => s.toggleVoice);
  const exit = useTourStore((s) => s.exit);

  const focusOn = useViewStore((s) => s.focusOn);
  const setMode = useViewStore((s) => s.setMode);
  const select = useSelectionStore((s) => s.select);

  const dwellTimer = useRef<number | undefined>(undefined);
  const safetyTimer = useRef<number | undefined>(undefined);

  // Scene setup — runs once per stop (camera fly, mode, highlight, live action).
  // Every stop first reverts any prior demo action, then applies its own, so the
  // sequence never leaves a subsystem in a stuck state.
  useEffect(() => {
    if (!active) {
      clearAllTourEffects();
      return;
    }
    const stop = TOUR[index];
    clearAllTourEffects();
    focusOn(stop.position, stop.target);
    setMode(stop.mode);
    applyStopAction(stop.action);
    applyStopFraming({ xray: stop.xray, fadeProps: stop.fadeProps });
    select(stop.focusId ?? null);
  }, [active, index, focusOn, setMode, select]);

  // Belt-and-braces: revert all demo actions when the controller unmounts;
  // and validate that no gas-carrying component is missing a tour stop (§B.4).
  useEffect(() => {
    validateTourCoverage();
    return () => clearAllTourEffects();
  }, []);

  // Narration + auto-advance.
  useEffect(() => {
    const clear = () => {
      window.clearTimeout(dwellTimer.current);
      window.clearTimeout(safetyTimer.current);
    };
    if (!active) {
      cancelSpeech();
      clear();
      select(null);
      return;
    }
    const stop = TOUR[index];
    cancelSpeech();
    clear();
    if (!playing) return; // paused: stay silent on the current stop

    const startedAt = performance.now();
    const estimate = dwellFor(stop.narration);
    // Hold each stop at least this long so it never flashes past when audio is
    // muted/absent and the browser fires 'end' instantly.
    const minDwell = Math.max(5500, estimate * 0.7);

    const doAdvance = () => {
      const st = useTourStore.getState();
      if (st.active && st.playing && st.index === index) st.next();
    };
    const guardedAdvance = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= minDwell) doAdvance();
      else dwellTimer.current = window.setTimeout(doAdvance, minDwell - elapsed);
    };

    if (voiceEnabled && speechSupported()) {
      speak(stop.narration, { onEnd: guardedAdvance });
      // Safety net: advance even if the browser never fires 'end'.
      safetyTimer.current = window.setTimeout(doAdvance, estimate + 5000);
    } else {
      dwellTimer.current = window.setTimeout(doAdvance, estimate);
    }
    return clear;
  }, [active, index, playing, voiceEnabled, next]);

  // Stop narration if the tour is exited/unmounted.
  useEffect(() => () => cancelSpeech(), []);

  if (!active) return null;
  const stop = TOUR[index];
  const isLast = index === TOUR.length - 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-4 pb-6">
      <div className="adani-panel pointer-events-auto w-full max-w-2xl overflow-hidden p-0">
        {/* Progress segments */}
        <div className="flex gap-0.5 px-3 pt-3">
          {TOUR.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i <= index ? BRAND.tealCng : 'rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider text-white"
                style={{ background: BRAND.primary }}
              >
                GUIDED TOUR
              </span>
              <span className="text-xs font-semibold text-[color:var(--hud-text)]">{stop.title}</span>
            </div>
            <span className="text-[11px] text-adani-muted">
              {index + 1} / {TOUR.length}
            </span>
          </div>

          {/* Subtitle / narration */}
          <p className="mt-2 min-h-[3.5rem] text-[13px] leading-relaxed text-[color:var(--hud-text)]">
            {stop.narration}
          </p>

          {/* Controls */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TourBtn onClick={prev} disabled={index === 0} label="Previous">
                ⏮
              </TourBtn>
              <button
                onClick={togglePlay}
                className="grid h-9 w-9 place-items-center rounded-lg text-white"
                style={{ background: playing ? BRAND.alert : BRAND.primary }}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <TourBtn onClick={next} disabled={isLast} label="Next">
                ⏭
              </TourBtn>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleVoice}
                className="rounded-lg px-3 py-2 text-xs font-semibold"
                style={{
                  background: voiceEnabled ? `${BRAND.tealCng}33` : 'rgba(255,255,255,0.06)',
                  color: voiceEnabled ? '#9fe6e7' : 'var(--adani-muted)',
                }}
                aria-pressed={voiceEnabled}
              >
                {voiceEnabled ? '🔊 Voice' : '🔇 Muted'}
              </button>
              <button
                onClick={exit}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
              >
                Exit Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TourBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition-opacity hover:bg-white/20 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
