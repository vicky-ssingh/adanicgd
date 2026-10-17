import { useVanStore } from '@/components3d/cng/MaintenanceVehicle';
import { BRAND } from '@/theme/tokens';

/** Section 17 §C.2 — maintenance-vehicle info panel. */
export function MaintenanceVanPanel() {
  const open = useVanStore((s) => s.open);
  const close = () => useVanStore.getState().setOpen(false);
  if (!open) return null;
  return (
    <div className="adani-panel pointer-events-auto w-60 p-4 sm:w-64">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>Field Operations</div>
          <h3 className="text-base font-bold leading-tight">Maintenance Vehicle — MV-07</h3>
          <div className="text-[11px] text-adani-muted">Adani Total Gas Limited</div>
        </div>
        <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Routine DRS inspection in progress at DRS-01 · North. The kiosk doors are open and the internal skid is under scheduled maintenance.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Task" value="DRS inspection" />
        <Row label="Crew" value="2 technicians" />
        <Row label="Fleet No." value="MV-07" />
        <Row label="Status" value="● ON SITE" accent={BRAND.tealCng} />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
