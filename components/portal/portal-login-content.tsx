'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tent, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRole } from '@/components/role-context';

export function PortalLoginContent() {
  const router = useRouter();
  const { setRole, setAuthed } = useRole();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const adminEmail = 'admin@ywcacamp.org';
      const superAdminEmail = 'superadmin@ywcacamp.org';
      const validPassword = 'camp2026';

      if (!email || !password) {
        setError('Please enter your email and password.');
        setLoading(false);
        return;
      }

      if (email === superAdminEmail && password === validPassword) {
        setRole('super-admin');
        setAuthed(true);
        router.push('/portal/super-admin');
        return;
      }

      if (email === adminEmail && password === validPassword) {
        setRole('admin');
        setAuthed(true);
        router.push('/portal/admin');
        return;
      }

      setError('Invalid credentials. Please check your email and password.');
      setLoading(false);
    }, 600);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-orange/15 blur-[120px] animate-aurora" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-brand-teal/15 blur-[120px] animate-aurora [animation-delay:4s]" />
        <div className="absolute inset-0 bg-grid opacity-10" />
      </div>

      <div className="w-full max-w-md px-6">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-ember text-white shadow-[0_0_30px_-4px_hsl(22_95%_56%/0.6)]">
            <Tent className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">YWCA Camp</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Staff Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access the admin dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl border border-border/60 p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@ywcacamp.org"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl bg-background/50 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl bg-background/50 pl-10"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full rounded-full glow-orange" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>

          <div className="border-t border-border/40 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Demo credentials:
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              <span className="text-brand-orange">admin@ywcacamp.org</span> · <span className="text-brand-teal">superadmin@ywcacamp.org</span> · pass: <span className="text-white">camp2026</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
