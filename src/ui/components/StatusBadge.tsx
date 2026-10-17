import type { NodeStatus } from '@/types/network';
import { BRAND } from '@/theme/tokens';

const COLORS: Record<NodeStatus, string> = {
  online: BRAND.primarySoft,
  warning: '#e0a23c',
  critical: BRAND.alert,
  offline: BRAND.muted,
};

const LABELS: Record<NodeStatus, string> = {
  online: 'ONLINE',
  warning: 'WARNING',
  critical: 'CRITICAL',
  offline: 'OFFLINE',
};

export function StatusBadge({ status }: { status: NodeStatus }) {
  const c = COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider"
      style={{ background: `${c}22`, color: c, border: `1px solid ${c}55` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: c, boxShadow: status === 'online' ? `0 0 6px ${c}` : 'none' }}
      />
      {LABELS[status]}
    </span>
  );
}
