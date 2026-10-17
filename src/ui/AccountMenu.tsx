import { useEffect, useState } from 'react';
import { supabase } from '@/auth/supabase';
import { signOut } from '@/auth/AuthGate';

/** Top-bar account chip: shows who is signed in, with a Sign out action. */
export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const initial = (email?.[0] ?? '?').toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="adani-panel grid h-9 w-9 place-items-center text-sm font-bold text-[color:var(--hud-text)]"
        aria-label="Account"
        title={email ?? 'Account'}
      >
        {initial}
      </button>
      {open && (
        <div className="adani-panel absolute right-0 mt-1.5 w-56 overflow-hidden p-1.5">
          <div className="px-2 pb-1.5 pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-adani-muted">Signed in as</div>
            <div className="truncate text-xs font-semibold text-white">{email ?? '—'}</div>
          </div>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs font-semibold text-[color:var(--hud-text)] transition-colors hover:bg-white/10"
          >
            ⎋ Sign out
          </button>
        </div>
      )}
    </div>
  );
}
