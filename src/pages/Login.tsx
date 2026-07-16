import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUpMessage, setSignedUpMessage] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (mode === 'sign-up') {
      setSignedUpMessage(true);
    }
    // On sign-in, App.tsx's onAuthStateChange listener picks up the new
    // session and re-renders past this screen automatically.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-[var(--color-ink)]">
          Spain &amp; Portugal Trip
        </h1>
        <p className="mt-1 text-sm text-[var(--color-slate)]">
          {mode === 'sign-in' ? 'Sign in to continue' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-[var(--color-ink-soft)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-[var(--color-petrol-100)] px-3 py-2 text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-petrol-500)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[var(--color-ink-soft)]">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-[var(--color-petrol-100)] px-3 py-2 text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-petrol-500)]"
            />
          </label>

          {error && <p className="text-sm text-[var(--color-brick-500)]">{error}</p>}
          {signedUpMessage && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              Account created. If email confirmation is required, check your
              inbox, then sign in below.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-[var(--color-petrol-500)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-petrol-600)] disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setSignedUpMessage(false);
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          className="mt-4 text-sm text-[var(--color-slate)] underline"
        >
          {mode === 'sign-in' ? "Need an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
