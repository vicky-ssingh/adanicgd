# Adani Shantigram CGD — Interactive 3D Digital Twin

An interactive, real-time **3D digital twin** of the Adani Total Gas *City Gas
Distribution (CGD)* network for Shantigram, Ahmedabad. It renders the entire gas
supply chain as a browser-based, explorable, simulated model — from the
transmission source through the City Gate, PRS/DRS regulation, the CNG station
family (Online, Mother, Daughter, Booster), the PNG consumer network
(residential, commercial, industrial), pipeline safety, and a live
SCADA/telemetry layer.

> Not a static visualisation: every asset is instrumented and driven by a live
> simulation, so the network reads as an **operations tool**, not just a 3D scene.

---

## Objective

- **Show the network is live, not just modelled.** Pressures, flows, cascade
  levels, demand and equipment status update every frame from a headless
  simulation engine and surface on a live dashboard.
- **Make the whole gas chain legible and traceable.** Click any asset to inspect
  it, highlight its supply route, and fly the camera to it. Guided-tour narration
  walks the full source-to-consumer journey.
- **Demonstrate real operational behaviour**, not idealised geometry: cascade
  bank sequencing, trailer logistics, sectionalizing-valve isolation, emergency
  shutdown (ESD), gas-leak auto-ESD, cathodic-protection surveys, SCADA polling
  with a deliberately degraded RTU, and remote operations from the control centre.
- **Run fully offline / procedurally.** The build sandbox has **no outbound
  network**, so there are no external CDNs, HDRIs, GLTF models or web fonts —
  every material, texture, environment map and asset is generated in code.
- **Stay presentation-grade for an Adani management / client demo**, with brand
  tokens isolated to a single file for a one-place swap when the official brand
  deck arrives.

---

## Deliverables

The project has two complementary deliverables:

1. **2D Flow Diagram** — a lightweight, self-contained **HTML + CSS animation**
   that lays out the CGD process flow (source → city gate → distribution →
   consumers) with animated gas movement. It is the quick-to-read schematic
   overview.
2. **3D Interactive Simulation** *(this repository)* — the full real-time digital
   twin: a React + Three.js application where the network is modelled in 3D, gas
   flow is animated, and every machinery component is navigable and clickable for
   inspection.

## Build Workflow

- **How the code is written.** The application is built with **React** in
  **TypeScript**. `.tsx` files are TypeScript + JSX — i.e. React components whose
  markup reads like HTML, styled with **Tailwind CSS** (a utility-first CSS
  framework: styling is applied through class names instead of separate
  stylesheets). So a single `.tsx` file combines structure (JSX/HTML-like),
  styling (Tailwind classes) and logic (TypeScript) in one place.
  - **React + Tailwind** → the 2D user interface (HUD, dashboard, info panels).
  - **React Three Fiber (React + Three.js)** → the 3D scene, animated gas-flow
    visualisation and interactive machinery navigation.
- **How the 3D assets are made.** All machinery, components and facilities are
  **modelled procedurally in code** — Three.js geometry composed and animated via
  React Three Fiber — rather than imported from Blender/GLTF model files. This is
  a deliberate choice so the app runs **fully offline** with no external asset
  downloads. *(Blender can still be used separately to prototype or author assets;
  it is not a runtime dependency of this build.)*
- **AI-assisted development.** The 2D flow and parts of the 3D build were produced
  with AI-assisted tooling — an agentic IDE (**Antigravity**), **Claude** for code
  generation, and **ChatGPT** for prompt refinement — while the architecture,
  integration and verification are maintained in this codebase.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Language | **TypeScript 5.6** | Strict typing across the whole app |
| UI framework | **React 18.3** | Component model + hooks |
| Build tool | **Vite 5.4** | Dev server (HMR) + production bundling; manual chunks for `three`/`r3f`/`postfx` |
| 3D renderer | **three.js 0.169** | WebGL scene graph, geometry, materials |
| React ↔ 3D | **@react-three/fiber 8.17** | Declarative three.js in React; imperative `useFrame` loops for heavy animation |
| 3D helpers | **@react-three/drei 9.114** | `OrbitControls`, `ContactShadows`, `AdaptiveDpr`, texture utils |
| Post-processing | **@react-three/postprocessing 2.16** + **postprocessing 6.36** | SSAO, Bloom, SMAA, ACES tone mapping |
| State | **Zustand 4.5** | Lightweight stores per facility/subsystem; read via `getState()` in the frame loop for zero per-frame re-renders |
| Styling | **Tailwind CSS 3.4** (+ PostCSS, Autoprefixer) | HUD / dashboard / info panels |

### Rendering & architecture highlights

- **Fully procedural assets** (offline constraint): PBR textures
  (roughness / normal / mottle / façade), an overcast/clear IBL environment map
  (PMREM-prefiltered canvas), and text/branding signage are all canvas-generated
  in `src/materials/`. Swapping to real `.hdr`/GLTF is isolated to one file.
- **Single source of truth** for the network topology in `src/config/network.ts`
  (nodes + edges) drives 3D placement, the simulation engine and the flow
  particles alike.
- **Headless simulation engine** (`src/simulation/`, `src/state/useSimStore.ts`)
  advances live per-node values + aggregates each tick, with selectable scenarios
  (high/low demand, pipeline isolation, pressure drop, equipment shutdown,
  gas leak, …).
- **Performance-minded**: instanced meshes for particles/props, imperative
  transforms via refs, cached materials, quality presets (low/medium/high) with
  MSAA/SSAO/DPR/shadow scaling that auto-picks by device.
- **Brand tokens** live only in `src/theme/tokens.ts` + `theme.css` — every brand
  colour (UI and 3D emissive) resolves back there.

---

## Project Structure

```
src/
  components3d/     3D scene content
    city/           township buildings, roads, props
    infrastructure/ city gate, PRS/DRS, SV stations, pig traps, route markers
    cng/            Online / Mother / Daughter / Booster stations, cascades, trailers
    png/            PNG network, wall pipework, consumer depth (residential/commercial/industrial)
    safety/         ESD, gas detection, fire protection, cathodic protection
    branding/       Adani logo decals + signage
  scene/            Canvas root, lighting, environment, post-processing, camera rig, tour director
  simulation/       headless simulation engine
  state/            Zustand stores (sim, view, selection, route, per-facility)
  config/           network topology, layouts, scenarios, camera presets
  materials/        procedural PBR materials, textures, signage generators
  theme/            brand tokens + CSS variables
  ui/               HUD, dashboard, info panels, controls, guided tour
```

The scene is built up in numbered **sections** (`0N_*.md` specs), each adding one
facility or subsystem additively without breaking the previous ones — City Gate &
regulation → CNG station family → mobile cascade logistics → cascade/priority
logic → odorization → pipeline safety (SV/pig/markers) → safety systems
(ESD/detection/fire/CP) → SCADA/telemetry → PNG consumer depth.

---

## Getting Started

```bash
npm install       # install dependencies
npm run dev       # start the Vite dev server (http://localhost:5173)
npm run build     # type-check + production build (dist/)
npm run preview   # preview the production build
npm run typecheck # type-check only
```

**Requirements:** Node.js 18+ and a WebGL2-capable browser.

---

## Status

Active development. Sections 01–09 are complete and browser-verified; Section 10
(PNG consumer depth) is implemented and verified. All builds are type-clean.

> **Branding note:** brand colours are placeholder values isolated to
> `src/theme/tokens.ts` / `theme.css`, pending Adani's verified brand deck (exact
> Pantone/CMYK, logo, typography) — a one-place swap.
