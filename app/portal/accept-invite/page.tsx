'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tent, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { resolveStaffDashboardPath } from '@/lib/auth/get-staff-role';

type Status = 'checking' | 'ready' | 'expired' | 'submitting' | 'success';

export default function AcceptInvitePage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<Status>('checking');
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function establishSession() {
      // Expired/invalid invite links land here with #error=...&error_description=...
      // in the fragment instead of tokens — Supabase appends these itself.
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const errorDescription = hashParams.get('error_description');
      if (errorDescription) {
        setLinkError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        setStatus('expired');
        return;
      }

      // Supabase's email templates have shipped two different link shapes
      // across versions: the older one puts `access_token`/`refresh_token`
      // directly in the URL FRAGMENT (handled below via setSession() — see
      // that block for why we don't rely on automatic detection). The
      // newer PKCE/OTP template instead puts a `token_hash` + `type` in
      // the QUERY STRING, handled here via an explicit verifyOtp() call.
      // Check both rather than assuming which one this project's email
      // template uses.
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = searchParams.get('token_hash');
      const otpType = searchParams.get('type');
      if (tokenHash && otpType) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType as 'invite' });
        if (cancelled) return;
        if (error) {
          setLinkError(error.message);
          setStatus('expired');
          return;
        }
        setStatus('ready');
        return;
      }

      // Fragment-based flow: access_token + refresh_token directly in the
      // hash. @supabase/ssr's createBrowserClient hardcodes flowType:
      // 'pkce' internally (confirmed by reading its source — it's set
      // after the options spread, so nothing passed in can override it).
      // In PKCE mode, detectSessionInUrl only auto-processes a `?code=`
      // query param via exchangeCodeForSession — it does NOT look at hash
      // fragments at all, so onAuthStateChange/getSession() never fire for
      // a link shaped like this one and it was incorrectly reported as
      // "expired" when the token was actually fine. Bypass automatic
      // detection entirely and establish the session directly from the
      // tokens sitting in the URL — setSession() works regardless of
      // flowType.
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (cancelled) return;
        if (error) {
          setLinkError(error.message);
          setStatus('expired');
          return;
        }
        setStatus('ready');
        return;
      }

      // Neither a token nor an error in the URL — not a valid invite link at all.
      setLinkError('This invite link is invalid or has expired.');
      setStatus('expired');
    }

    establishSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    const supabase = createClient();

    // The session was already established client-side above (from the
    // invite link's tokens) — pass its access token to the rate-limited
    // server route so it can verify + apply the password update without
    // us calling updateUser() directly from the browser.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setFormError('Your session has expired. Please reopen your invite link.');
      setStatus('expired');
      return;
    }

    const res = await fetch('/api/portal/accept-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setFormError(body?.error ?? 'Something went wrong. Please try again.');
      setStatus('ready');
      return;
    }

    await supabase.rpc('mark_staff_active');

    const dashboardPath = await resolveStaffDashboardPath(supabase);
    setStatus('success');

    setTimeout(() => {
      router.push(dashboardPath ?? '/portal/login');
      router.refresh();
    }, 1200);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-orange/15 blur-[120px] animate-aurora" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-brand-navy/15 blur-[120px] animate-aurora [animation-delay:4s]" />
        <div className="absolute inset-0 bg-grid opacity-10" />
      </div>

      <div className="w-full max-w-md px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-ember text-white shadow-[0_0_30px_-4px_hsl(22_95%_56%/0.6)]">
            <Tent className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">YWCA Camp</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">Accept your invite</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set a password to activate your staff account</p>
        </div>

        <div className="glass-strong rounded-2xl border border-border/60 p-6 sm:p-8">
          {status === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Verifying your invite link...
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="font-semibold text-foreground">Link invalid or expired</p>
              <p className="text-sm text-muted-foreground">{linkError ?? 'This invite link is no longer valid.'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Invite links expire after 1 hour. Contact your Super Admin to send a new invite from the Staff tab.
              </p>
            </div>
          )}

          {(status === 'ready' || status === 'submitting') && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl bg-background/50 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl bg-background/50 pl-10"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full rounded-full glow-orange" disabled={status === 'submitting'}>
                {status === 'submitting' ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting password...</>
                ) : (
                  <>Set password &amp; continue <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="font-semibold text-foreground">Account activated</p>
              <p className="text-sm text-muted-foreground">Taking you to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
