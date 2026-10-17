import type { PipeTier } from '@/components3d/infrastructure/PipelineNetwork';

export type NetworkKind = 'common' | 'cng' | 'png';

export type NodeType =
  | 'source'
  | 'citygate'
  | 'filtration'
  | 'metering'
  | 'prs'
  | 'drs'
  | 'cng-station'
  | 'png-consumer'
  | 'ctm'
  | 'analyser'
  | 'service-regulator'
  | 'mrs'
  | 'laboratory'
  | 'mass-flow-meter';

export interface NominalValues {
  /** Bar */
  pressure: number;
  /** SCMH */
  flow: number;
  /** °C */
  temperature: number;
}

export interface NetNode {
  id: string;
  label: string;
  type: NodeType;
  network: NetworkKind;
  /** World position of the asset (for selection focus + labels). */
  position: [number, number, number];
  nominal: NominalValues;
  purpose: string;
}

export interface NetEdge {
  id: string;
  from: string;
  to: string;
  tier: PipeTier;
  network: NetworkKind;
  /** Polyline the pipe follows in world space (also drives flow particles). */
  points: [number, number, number][];
  /** Whether PipelineNetwork should draw a pipe for this edge (process-internal
   *  edges are already drawn by their station component and only carry flow). */
  render?: boolean;
  /** Visual-only consumer tag for flow/pipe colour-coding (no sim effect). */
  consumer?: 'residential' | 'industrial' | 'commercial';
}

export interface NetworkGraph {
  nodes: NetNode[];
  edges: NetEdge[];
}

/** Live per-node simulated values produced by the engine each tick. */
export type NodeStatus = 'online' | 'warning' | 'critical' | 'offline';

export interface LiveValue {
  pressure: number;
  flow: number;
  temperature: number;
  /** 0..1 fraction of nominal load currently drawn. */
  load: number;
  status: NodeStatus;
}
