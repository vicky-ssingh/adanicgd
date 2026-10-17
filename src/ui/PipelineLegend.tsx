import { useState } from 'react';

/**
 * Pipeline legend (Fix Problem 2E). Small collapsible glass panel, bottom-left,
 * with colour swatches matching the actual pipeline/flow colours in the scene.
 */
const LINES: { label: string; color: string }[] = [
  { label: 'Transmission (HP Steel)', color: '#9ca3af' },
  { label: 'Distribution (Steel)', color: '#6b7280' },
  { label: 'CNG Network (Teal)', color: '#00e5cc' },
  { label: 'PNG Residential (Blue)', color: '#4db8ff' },
  { label: 'PNG Industrial (Amber)', color: '#ff9500' },
  { label: 'PNG Commercial (Violet)', color: '#b066ff' },
];

export function PipelineLegend() {
  const [open, setOpen] = useState(true);

  return (
    <div className="adani-panel pointer-events-auto w-56 p-2.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold tracking-wide">PIPELINE LEGEND</span>
        <span className="text-[10px] text-adani-muted">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {LINES.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span
                className="h-[3px] w-6 flex-none rounded-full"
                style={{ background: l.color, boxShadow: `0 0 6px ${l.color}aa` }}
              />
              <span className="text-[11px] text-[color:var(--hud-text)]">{l.label}</span>
            </div>
          ))}
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 flex-none rounded-full"
              style={{ background: '#4db8ff', boxShadow: '0 0 8px #4db8ffcc' }}
            />
            <span className="text-[11px] text-[color:var(--hud-text)]">Active PNG Connection</span>
          </div>
        </div>
      )}
    </div>
  );
}
