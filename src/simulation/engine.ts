import { NETWORK } from '@/config/network';
import { SCENARIOS, type ScenarioId } from '@/config/scenarios';
import type { LiveValue, NodeStatus } from '@/types/network';

/**
 * Headless simulation engine (spec §2.11 / §2.26 / §2.27). Given the elapsed sim
 * time and active scenario, produces live per-node values (pressure/flow/temp/
 * load/status) and network aggregates. Values oscillate smoothly around nominal
 * so the dashboard reads as a live twin, and react to scenario modifiers.
 */

export interface Aggregates {
  totalFlow: number;
  networkPressure: number;
  cngDemand: number;
  pngDemand: number;
  activeCngStations: number;
  connectedPngConsumers: number;
  activePrsDrs: number;
  systemHealth: number;
  alerts: string[];
}

export interface SimSnapshot {
  values: Record<string, LiveValue>;
  aggregates: Aggregates;
}

// Stable per-node phase offsets so each meter breathes independently.
const PHASE: Record<string, number> = Object.fromEntries(
  NETWORK.nodes.map((n, i) => [n.id, (i * 1.618) % (Math.PI * 2)]),
);

function osc(elapsed: number, phase: number, freq = 0.35, amp = 0.03) {
  return 1 + Math.sin(elapsed * freq + phase) * amp + Math.sin(elapsed * 1.7 + phase) * amp * 0.3;
}

/** Supply terminals used to scale network totals when valves isolate them. */
const CNG_TERMINALS = ['cng-station', 'mother-station'];
const PNG_TERMINAL = 'drs1';

export function computeTick(
  elapsed: number,
  scenarioId: ScenarioId,
  isolated: ReadonlySet<string> = new Set(),
): SimSnapshot {
  const sc = SCENARIOS[scenarioId];
  const values: Record<string, LiveValue> = {};

  let totalFlow = 0;
  let pressureSum = 0;
  let pressureCount = 0;
  let activePrsDrs = 0;
  const alerts: string[] = [];

  for (const node of NETWORK.nodes) {
    const phase = PHASE[node.id] ?? 0;
    const isOffline = sc.offline?.includes(node.id) ?? false;
    const isIsolated = isolated.has(node.id);

    let flow = node.nominal.flow * sc.flowFactor * osc(elapsed, phase, 0.4, 0.04);
    let pressure = node.nominal.pressure * sc.pressureFactor * osc(elapsed, phase, 0.3, 0.015);
    const temperature = node.nominal.temperature + Math.sin(elapsed * 0.2 + phase) * 1.5;

    let status: NodeStatus = 'online';

    if (isOffline) {
      flow = 0;
      pressure = node.type === 'prs' ? pressure * 0.05 : 0;
      status = 'offline';
    } else if (sc.warnTypes?.includes(node.type)) {
      status = 'warning';
    }

    // Pressure-band health checks vs nominal.
    const pRatio = node.nominal.pressure > 0 ? pressure / node.nominal.pressure : 1;
    if (!isOffline) {
      if (pRatio < 0.7) status = 'critical';
      else if (pRatio < 0.85 && status === 'online') status = 'warning';
    }

    // A shut line valve upstream: no flow, line depressurised (alerts come
    // from the valve store, one per valve, not one per isolated node).
    if (isIsolated) {
      flow = 0;
      pressure = 0;
      status = 'offline';
    }

    const load = node.nominal.flow > 0 ? flow / node.nominal.flow : 0;
    values[node.id] = { pressure, flow, temperature, load, status };

    if (node.type === 'drs' || node.type === 'prs') {
      if (!isOffline && !isIsolated) activePrsDrs++;
    }
    if (node.type === 'source') totalFlow = flow;
    if ((node.type === 'prs' || node.type === 'drs') && !isIsolated) {
      pressureSum += pressure;
      pressureCount++;
    }

    if (isIsolated) continue;
    if (status === 'critical') alerts.push(`${node.label}: pressure critical`);
    else if (status === 'offline') alerts.push(`${node.label}: offline`);
    else if (status === 'warning') alerts.push(`${node.label}: pressure low`);
  }

  const networkPressure = pressureCount ? pressureSum / pressureCount : 0;

  // Valve isolation: scale CNG / PNG offtake by the share of terminals still fed.
  const nominalOf = (id: string) => NETWORK.nodes.find((n) => n.id === id)?.nominal.flow ?? 0;
  const cngNominal = CNG_TERMINALS.reduce((a, id) => a + nominalOf(id), 0);
  const cngAlive = cngNominal ? CNG_TERMINALS.filter((id) => !isolated.has(id)).reduce((a, id) => a + nominalOf(id), 0) / cngNominal : 1;
  const pngAlive = isolated.has(PNG_TERMINAL) ? 0 : 1;
  const sourceFlow = totalFlow;
  totalFlow = sourceFlow * (sc.cngSplit * cngAlive + sc.pngSplit * pngAlive) / Math.max(1e-6, sc.cngSplit + sc.pngSplit);
  const cngDemand = sourceFlow * sc.cngSplit * cngAlive;
  const pngDemand = sourceFlow * sc.pngSplit * pngAlive;

  // Placeholder counts until CNG stations (M6) and PNG consumers (M7) are nodes.
  const activeCngStations = scenarioId === 'equipment-shutdown' ? 0 : 3 - CNG_TERMINALS.filter((id) => isolated.has(id)).length;
  const connectedPngConsumers =
    scenarioId === 'equipment-shutdown' || isolated.has('png-zone') ? 0 : 1240 + Math.round(Math.sin(elapsed * 0.1) * 20);

  const offlineCount = NETWORK.nodes.filter((n) => sc.offline?.includes(n.id)).length;
  const warnCount = alerts.length - offlineCount;
  const systemHealth = Math.max(
    0,
    Math.round(100 - offlineCount * 18 - Math.max(0, warnCount) * 5 - isolated.size * 4),
  );

  return {
    values,
    aggregates: {
      totalFlow,
      networkPressure,
      cngDemand,
      pngDemand,
      activeCngStations,
      connectedPngConsumers,
      activePrsDrs,
      systemHealth,
      alerts,
    },
  };
}
