/** Number / unit formatting for the dashboard + info panels. */

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtFlow(scmh: number): string {
  if (scmh >= 100000) return `${fmt(scmh / 1000, 1)}k`;
  return fmt(scmh);
}

export function fmtPressure(bar: number): string {
  if (bar < 1) return `${fmt(bar * 1000, 0)} mbar`;
  return `${fmt(bar, 1)} Bar`;
}
