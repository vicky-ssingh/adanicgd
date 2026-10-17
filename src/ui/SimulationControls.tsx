import { useSimStore } from '@/state/useSimStore';
import { SCENARIO_LIST, SCENARIOS, type ScenarioId } from '@/config/scenarios';
import { BRAND } from '@/theme/tokens';

const SPEEDS = [0.5, 1, 2, 4];

/**
 * Simulation control panel (spec §2.26): play/pause, reset, speed, and the
 * scenario selector. The scene reacts live via the sim store + engine.
 */
export function SimulationControls() {
  const playing = useSimStore((s) => s.playing);
  const speed = useSimStore((s) => s.speed);
  const scenario = useSimStore((s) => s.scenario);
  const togglePlay = useSimStore((s) => s.togglePlay);
  const reset = useSimStore((s) => s.reset);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const setScenario = useSimStore((s) => s.setScenario);

  const sc = SCENARIOS[scenario];

  return (
    <div className="adani-panel pointer-events-auto flex max-w-[95vw] flex-wrap items-center justify-center gap-3 px-3 py-2">
      {/* Transport */}
      <button
        onClick={togglePlay}
        className="grid h-9 w-9 place-items-center rounded-lg text-white transition-colors"
        style={{ background: playing ? BRAND.alert : BRAND.primary }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <button
        onClick={reset}
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
        aria-label="Reset"
      >
        ↻
      </button>

      {/* Speed */}
      <div className="flex items-center gap-1">
        <span className="mr-0.5 text-[10px] uppercase text-adani-muted">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="rounded-md px-2 py-1 text-xs font-semibold transition-colors"
            style={{
              background: speed === s ? BRAND.primary : 'rgba(255,255,255,0.06)',
              color: speed === s ? '#fff' : 'var(--adani-muted)',
            }}
          >
            {s}×
          </button>
        ))}
      </div>

      <div className="h-8 w-px bg-white/10" />

      {/* Scenario */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide text-adani-muted">Scenario</span>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as ScenarioId)}
          className="mt-0.5 w-52 rounded-md border border-[color:var(--panel-border)] bg-black/30 px-2 py-1 text-xs font-semibold text-white outline-none"
        >
          {SCENARIO_LIST.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#0b2545]">
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden max-w-[180px] text-[11px] leading-tight text-adani-muted lg:block">
        {sc.description}
      </div>
    </div>
  );
}
