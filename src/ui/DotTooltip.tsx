import { useTooltipStore } from '@/state/useTooltipStore';

/** DOM tooltip for gas-connection dots (Fix Problem 2C). */
export function DotTooltip() {
  const { visible, x, y, text } = useTooltipStore();
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div
        className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
        style={{
          background: 'rgba(10,20,35,0.9)',
          color: '#dff0ff',
          border: '1px solid rgba(96,165,250,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
}
