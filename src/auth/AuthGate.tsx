import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';

// The 3D twin is only downloaded after a successful sign-in.
const App = lazy(() => import('../App'));

type View = 'loading' | 'signin' | 'forgot' | 'recovery' | 'app';

/**
 * Login gate (Supabase Auth, email + password). Nothing of the twin renders —
 * or even downloads — until there is a valid session. There is no public
 * sign-up: accounts are created by the admin in the Supabase dashboard.
 * Also handles "forgot password" → emailed link → set a new password.
 */
export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>('loading');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setView(data.session ? 'app' : 'signin');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setView('recovery');
      else if (event === 'SIGNED_OUT') setView('signin');
      else if (s && event === 'SIGNED_IN') setView((v) => (v === 'recovery' ? v : 'app'));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <Shell>
        <p className="text-center text-sm text-adani-muted">
          Sign-in is not configured for this deployment. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, then rebuild.
        </p>
      </Shell>
    );
  }

  if (view === 'app' && session) {
    return (
      <Suspense fallback={<Shell><p className="text-center text-sm text-adani-muted">Loading the digital twin…</p></Shell>}>
        <App />
      </Suspense>
    );
  }
  if (view === 'loading') return <Shell><p className="text-center text-sm text-adani-muted">Checking session…</p></Shell>;
  if (view === 'forgot') return <ForgotForm onBack={() => setView('signin')} />;
  if (view === 'recovery') return <NewPasswordForm onDone={() => setView('app')} />;
  return <SignInForm onForgot={() => setView('forgot')} />;
}

export async function signOut() {
  await supabase?.auth.signOut();
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Incorrect email or password.' : err.message);
  };

  return (
    <Shell>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-center text-sm font-bold uppercase tracking-[0.18em]">Sign in</h2>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <ErrorNote text={error} />}
        <SubmitButton busy={busy} label="Sign in" />
        <button type="button" onClick={onForgot} className="text-center text-[12px] text-adani-muted hover:text-white">
          Forgot password?
        </button>
      </form>
    </Shell>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <Shell>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-center text-sm font-bold uppercase tracking-[0.18em]">Reset password</h2>
        {sent ? (
          <p className="text-center text-[13px] text-adani-muted">If that email has an account, a reset link is on its way.</p>
        ) : (
          <>
            <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" />
            {error && <ErrorNote text={error} />}
            <SubmitButton busy={busy} label="Send reset link" />
          </>
        )}
        <button type="button" onClick={onBack} className="text-center text-[12px] text-adani-muted hover:text-white">
          ← Back to sign in
        </button>
      </form>
    </Shell>
  );
}

function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message);
    else onDone();
  };

  return (
    <Shell>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-center text-sm font-bold uppercase tracking-[0.18em]">Set a new password</h2>
        <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && <ErrorNote text={error} />}
        <SubmitButton busy={busy} label="Save password" />
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-full w-full flex-col overflow-y-auto px-4 py-10"
      style={{ background: 'radial-gradient(1200px 800px at 50% 30%, var(--adani-navy), var(--adani-navy-deep) 70%)' }}
    >
      <div className="m-auto w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white/95 px-5 py-3" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 160, height: 'auto', display: 'block' }} draggable={false} />
          </div>
          <div className="text-center">
            <div className="text-xl font-extrabold tracking-[0.2em]">ADANI SHANTIGRAM</div>
            <div className="mt-1 text-xs font-medium text-adani-muted">City Gas Distribution Network — Digital Twin</div>
          </div>
        </div>
        <div className="adani-panel p-5">{children}</div>
        <p className="mt-4 text-center text-[11px] text-adani-muted">Authorised users only.</p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-adani-muted">
      {label}
      <input
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-white/40"
      />
    </label>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg, var(--adani-primary, #0B74B0), #14b8a6)' }}
    >
      {busy ? 'Please wait…' : label}
    </button>
  );
}

function ErrorNote({ text }: { text: string }) {
  return <div className="rounded-md bg-red-500/15 px-2 py-1.5 text-[12px] font-semibold text-red-200">{text}</div>;
}
