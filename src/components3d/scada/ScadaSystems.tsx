import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RtuCabinet } from './RtuCabinet';
import { ControlCentre } from './ControlCentre';
import { ScadaLayer } from './ScadaLayer';
import { RTUS } from '@/config/scadaLayout';
import { useScadaStore } from '@/state/useScadaStore';
import { useSimStore } from '@/state/useSimStore';
import { useSvStore } from '@/state/useSvStore';
import { useEsdStore } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { useStationStore } from '@/state/useStationStore';
import { logEvent } from '@/state/useEventLogStore';
import { SV_STATIONS, SV_BY_ID } from '@/config/svStations';
import { FACILITIES, FACILITY_BY_ID } from '@/config/safetyLayout';
import { SCENARIOS } from '@/config/scenarios';

/**
 * Section 09 — SCADA systems mount. Places the 15 RTU cabinets + the control
 * centre, renders the telemetry overlay when enabled, keeps the "packets today"
 * counter advancing, and generates live event-log entries from real Section-01–08
 * state transitions. All additive; nothing upstream is modified.
 */
function svFocus(id: string) {
  const p = SV_BY_ID[id as keyof typeof SV_BY_ID].position;
  return { position: [p[0] + 12, 9, p[2] + 12] as [number, number, number], target: [p[0], 2, p[2]] as [number, number, number] };
}
function facFocus(id: string) {
  const f = FACILITY_BY_ID[id as keyof typeof FACILITY_BY_ID];
  const s = f.strobe;
  return { position: [s[0] + 18, 16, s[2] + 18] as [number, number, number], target: [s[0], 3, s[2]] as [number, number, number] };
}

/** Advances the packet counter (~5 polls/s across the fleet) without React churn. */
function ScadaRunner() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt * 5;
    if (acc.current >= 1) {
      const n = Math.floor(acc.current);
      acc.current -= n;
      useScadaStore.getState().bumpPackets(n);
    }
  });
  return null;
}

/** Watches live state and appends colour-coded log entries as events occur. */
function EventLogRunner() {
  const prev = useRef({
    scenario: useSimStore.getState().scenario,
    sv: Object.fromEntries(SV_STATIONS.map((s) => [s.id, useSvStore.getState().rt[s.id].closed])) as Record<string, boolean>,
    esd: Object.fromEntries(FACILITIES.map((f) => [f.id, useEsdStore.getState().fac[f.id].tripped])) as Record<string, boolean>,
    gasAuto: useGasStore.getState().autoTripped,
    switches: useStationStore.getState().switchesToday,
  });
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    if (t.current < 0.3) return; // ~3 Hz is plenty for discrete events
    t.current = 0;
    const p = prev.current;
    let scenarioHandled = false;

    // SV valves
    const svRt = useSvStore.getState().rt;
    for (const s of SV_STATIONS) {
      const now = svRt[s.id].closed;
      if (now !== p.sv[s.id]) {
        p.sv[s.id] = now;
        scenarioHandled = true;
        if (now) logEvent('crit', `${s.id} CLOSED — section isolated`, svFocus(s.id));
        else logEvent('info', `${s.id} reopened — section restored`, svFocus(s.id));
      }
    }

    // ESD trips
    const fac = useEsdStore.getState().fac;
    for (const f of FACILITIES) {
      const now = fac[f.id].tripped;
      if (now !== p.esd[f.id]) {
        p.esd[f.id] = now;
        scenarioHandled = true;
        if (now) logEvent('crit', `ESD TRIP — ${f.label}`, facFocus(f.id));
        else logEvent('info', `${f.label} ESD reset — restart sequence`, facFocus(f.id));
      }
    }

    // Gas auto-ESD
    const gasAuto = useGasStore.getState().autoTripped;
    if (gasAuto !== p.gasAuto) {
      p.gasAuto = gasAuto;
      if (gasAuto) { logEvent('crit', 'AUTO-ESD — high gas concentration — GD-04'); scenarioHandled = true; }
    }

    // Priority-panel bank switch (Online CNG)
    const st = useStationStore.getState();
    if (st.switchesToday !== p.switches) {
      p.switches = st.switchesToday;
      logEvent('info', `Priority panel PP-01 ${st.lastSwitch}`, { position: [66, 15, 68], target: [90, 3, 92] });
    }

    // Generic scenario change (manual, from the sim controls) not already covered
    const sc = useSimStore.getState().scenario;
    if (sc !== p.scenario) {
      p.scenario = sc;
      if (!scenarioHandled) {
        const def = SCENARIOS[sc];
        const sev = def.accent === 'alert' ? 'warn' : 'info';
        const text = sc === 'normal' ? 'Network returned to normal operation' : `Scenario: ${def.label}`;
        logEvent(sev, text, { position: [95, 68, 118], target: [0, 4, 0] });
      }
    }
  });
  return null;
}

export function ScadaSystems() {
  const layerOn = useScadaStore((s) => s.layerOn);
  return (
    <group>
      {RTUS.map((r) => (
        <RtuCabinet key={r.id} rtu={r} />
      ))}
      <ControlCentre />
      {layerOn && <ScadaLayer />}
      <ScadaRunner />
      <EventLogRunner />
    </group>
  );
}
