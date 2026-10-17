interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  accent?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}

/** Reusable Adani-styled segmented control (mode toggle, day/night, etc.). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-[color:var(--panel-border)] bg-black/25 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              color: active ? '#fff' : 'var(--adani-muted)',
              background: active
                ? opt.accent ?? 'var(--adani-primary)'
                : 'transparent',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
