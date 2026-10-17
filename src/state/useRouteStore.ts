import { create } from 'zustand';

/**
 * Highlighted gas-supply route (Fix Problem 2D). When a building/station is
 * clicked, `edges` holds the set of pipeline edge ids on its supply route and
 * `chain` the ordered stage labels for the route panel. Null = no highlight.
 */
export interface RouteInfo {
  edges: Set<string>;
  chain: string[];
  title: string;
  flow: number;
}

interface RouteState {
  edges: Set<string> | null;
  chain: string[];
  title: string;
  flow: number;
  setRoute: (r: RouteInfo | null) => void;
  clear: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  edges: null,
  chain: [],
  title: '',
  flow: 0,
  setRoute: (r) =>
    r
      ? set({ edges: r.edges, chain: r.chain, title: r.title, flow: r.flow })
      : set({ edges: null, chain: [], title: '', flow: 0 }),
  clear: () => set({ edges: null, chain: [], title: '', flow: 0 }),
}));
