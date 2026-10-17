import { BrandLockup } from './BrandLockup';
import { Segmented } from './controls/Segmented';
import { Dashboard } from './Dashboard';
import { InfoPanel } from './InfoPanel';
import { SimulationControls } from './SimulationControls';
import { CameraMenu } from './CameraMenu';
import { RoutePanel } from './RoutePanel';
import { MeterPanel } from './MeterPanel';
import { StationInfoPanel } from './StationInfoPanel';
import { MotherInfoPanel } from './MotherInfoPanel';
import { TrailerInfoPanel } from './TrailerInfoPanel';
import { CascadeLogistics } from './CascadeLogistics';
import { DaughterInfoPanel } from './DaughterInfoPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { CascadeSummary } from './CascadeSummary';
import { OdorInfoPanel } from './OdorInfoPanel';
import { SvInfoPanel } from './SvInfoPanel';
import { ValvePanel } from './ValvePanel';
import { MarkerInfoPanel } from './MarkerInfoPanel';
import { PigInfoPanel } from './PigInfoPanel';
import { EsdPanel } from './EsdPanel';
import { GasDetectorPanel } from './GasDetectorPanel';
import { CpInfoPanel } from './CpInfoPanel';
import { RtuInfoPanel } from './RtuInfoPanel';
import { ControlCentrePanel } from './ControlCentrePanel';
import { TelemetryWidget } from './TelemetryWidget';
import { EventLog } from './EventLog';
import { PngConsumerPanel } from './PngConsumerPanel';
import { DrsInfoPanel } from './DrsInfoPanel';
import { PerfOverlay } from './PerfOverlay';
import { MaintenanceVanPanel } from './MaintenanceVanPanel';
import { useCpStore } from '@/state/useCpStore';
import { useXrayStore } from '@/state/useXrayStore';
import { PipelineLegend } from './PipelineLegend';
import { SettingsMenu } from './SettingsMenu';
import { TourController } from './TourController';
import { useViewStore } from '@/state/useViewStore';
import { useTourStore } from '@/state/useTourStore';
import { useDaughterStore } from '@/state/useDaughterStore';
import { BRAND } from '@/theme/tokens';

/**
 * HUD frame (spec §2.39). Brand lockup + tour launcher + network/day-night
 * toggles + camera menu on top; live dashboard on the left; component info panel
 * on the right; simulation controls along the bottom. During the guided tour the
 * working panels tuck away for a cinematic presentation; the tour bar takes over.
 */
export function Hud() {
  const { mode, setMode, timeOfDay, toggleTimeOfDay, presentation, togglePresentation } = useViewStore();
  const tourActive = useTourStore((s) => s.active);
  const startTour = useTourStore((s) => s.start);
  const compareOpen = useDaughterStore((s) => s.compareOpen);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 select-none"
      style={presentation ? { fontSize: '1.12em' } : undefined}
    >
      {/* Presentation-mode vignette to focus attention (Section 11 §D.5) */}
      {presentation && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ boxShadow: 'inset 0 0 200px 60px rgba(0,0,0,0.55)' }}
          aria-hidden
        />
      )}
      {/* Top-left: brand + dashboard (dashboard hidden during tour) */}
      <div className="absolute left-4 top-4 flex flex-col gap-3">
        <div
          className="adani-panel pointer-events-auto px-4 py-2.5"
          style={presentation ? { transform: 'scale(1.18)', transformOrigin: 'top left' } : undefined}
        >
          <BrandLockup />
        </div>
        {!tourActive && <Dashboard />}
        {!tourActive && <CascadeSummary />}
        {!tourActive && <CascadeLogistics />}
        {!tourActive && <TelemetryWidget />}
      </div>

      {/* Top-right: tour + camera + mode + day/night + settings (wraps on mobile) */}
      {!tourActive && (
        <div className="pointer-events-auto absolute right-2 top-4 flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-end gap-2 sm:right-4">
          <button
            onClick={startTour}
            className="adani-panel flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
          >
            <span aria-hidden>▶</span>
            <span className="hidden sm:inline">Guided Tour</span>
          </button>
          <CameraMenu />
          <Segmented
            ariaLabel="Network focus"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'CNG', label: 'CNG', accent: BRAND.tealCng },
              { value: 'PNG', label: 'PNG', accent: BRAND.violetPng },
              { value: 'BOTH', label: 'BOTH', accent: BRAND.primary },
            ]}
          />
          <button
            onClick={toggleTimeOfDay}
            className="adani-panel px-3 py-2 text-xs font-semibold text-[color:var(--hud-text)]"
            aria-label="Toggle day / night"
          >
            {timeOfDay === 'day' ? '☀' : '☾'}
            <span className="ml-1 hidden md:inline">{timeOfDay === 'day' ? 'Day' : 'Night'}</span>
          </button>
          <CpSurveyToggle />
          <InternalFlowToggle />
          <button
            onClick={togglePresentation}
            className="adani-panel px-3 py-2 text-xs font-semibold"
            style={{ color: presentation ? '#fff' : 'var(--hud-text)', background: presentation ? `${BRAND.primary}44` : undefined }}
            aria-pressed={presentation}
            title="Presentation mode (projector-friendly)"
          >
            🖥 <span className="ml-1 hidden md:inline">{presentation ? 'Present On' : 'Present'}</span>
          </button>
          <SettingsMenu />
        </div>
      )}

      {/* Right: selected component + gas-supply route (hidden during tour) */}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <InfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <StationInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <MotherInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <TrailerInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <DaughterInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <OdorInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <SvInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <ValvePanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <MarkerInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <PigInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <EsdPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <GasDetectorPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <CpInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <RtuInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <ControlCentrePanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <PngConsumerPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <DrsInfoPanel />
        </div>
      )}
      {!tourActive && (
        <div className="absolute right-4 top-20">
          <MaintenanceVanPanel />
        </div>
      )}
      {/* Station-type comparison (Section 04 Part C). Outside the tour it shows
          its launcher; during the tour it appears only for the Daughter-vs-Booster
          stop (when the comparison has been opened by the tour action). */}
      {(!tourActive || compareOpen) && (
        <div
          className={
            tourActive
              ? 'pointer-events-none absolute right-4 top-20 z-20' // §17 B.2: opposite the subject during the tour
              : 'pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2'
          }
        >
          <ComparisonPanel />
        </div>
      )}
      {!tourActive && <RoutePanel />}
      {!tourActive && <MeterPanel />}

      {/* Bottom-center: simulation controls (hidden during tour) */}
      {!tourActive && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <SimulationControls />
        </div>
      )}

      {/* Bottom-left: pipeline legend (hidden on small screens to avoid overlap) */}
      {!tourActive && (
        <div className="absolute bottom-4 left-4 hidden lg:block">
          <PipelineLegend />
        </div>
      )}

      {/* Bottom-right: live SCADA event log (Section 09 §8.2) */}
      {!tourActive && (
        <div className="absolute bottom-4 right-4 hidden md:block">
          <EventLog />
        </div>
      )}

      {/* Guided tour overlay */}
      <TourController />

      {/* Performance overlay (Shift+P) — always available, even during the tour */}
      <PerfOverlay />

      {/* Footer credit (spec §0.1) — hidden on small screens */}
      {!tourActive && (
        <div className="absolute bottom-2 left-1/2 hidden -translate-x-1/2 md:block">
          <div className="rounded-full bg-black/30 px-4 py-1 text-[11px] font-medium text-adani-muted backdrop-blur-sm">
            Powered by Adani Total Gas Limited — Shantigram, Ahmedabad
          </div>
        </div>
      )}
    </div>
  );
}

/** Section 12 §A.3.2 — SHOW INTERNAL FLOW (X-ray inspection) toggle. */
function InternalFlowToggle() {
  const on = useXrayStore((s) => s.on);
  const toggle = useXrayStore((s) => s.toggle);
  return (
    <button
      onClick={toggle}
      className="adani-panel px-3 py-2 text-xs font-semibold"
      style={{ color: on ? '#fff' : 'var(--hud-text)', background: on ? `${BRAND.tealCng}44` : undefined }}
      aria-pressed={on}
      title="Show internal gas flow (engineering cutaway)"
    >
      ⬡ <span className="ml-1 hidden md:inline">{on ? 'Flow On' : 'Internal Flow'}</span>
    </button>
  );
}

/** Section 08 §D.3 — SHOW CP SURVEY layer toggle. */
function CpSurveyToggle() {
  const on = useCpStore((s) => s.surveyOn);
  const toggle = useCpStore((s) => s.toggleSurvey);
  return (
    <button
      onClick={toggle}
      className="adani-panel px-3 py-2 text-xs font-semibold"
      style={{ color: on ? '#fff' : 'var(--hud-text)', background: on ? '#e8772233' : undefined }}
      aria-pressed={on}
      title="Show cathodic-protection survey"
    >
      🛡 <span className="ml-1 hidden md:inline">CP {on ? 'On' : 'Survey'}</span>
    </button>
  );
}
