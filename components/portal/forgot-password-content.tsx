'use client';

import * as React from 'react';
import { Tent, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordContent() {
  const [username, setUsername] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/portal/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).catch(() => null);
    // Always show the same confirmation, whether or not anything was
    // actually sent — the whole point is that a caller can't tell.
    setSubmitted(true);
    setLoading(false);
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
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Username accounts only — email/invited accounts should contact a Super Admin.</p>
        </div>

        <div className="glass-strong rounded-2xl border border-border/60 p-6 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-sm text-foreground">
                If that username exists and has a recovery email on file, a reset link has been sent to it.
              </p>
              <p className="text-xs text-muted-foreground">The link expires in 1 hour and can only be used once.</p>
              <a href="/portal/login" className="mt-2 text-sm font-semibold text-primary hover:underline">Back to login</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-xl bg-background/50 pl-10"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full glow-orange" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <>Send reset link <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
