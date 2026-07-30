import Link from 'next/link';
import { getAllSeasonsWithCampsForPortal } from '@/lib/queries/camps';

export default async function AnalyticsIndexPage() {
  const seasons = await getAllSeasonsWithCampsForPortal();

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-foreground">Analytics</h1>
      <p className="mt-1 text-muted-foreground">Registration, revenue, and waitlist reporting per camp and per season.</p>

      <div className="mt-8 space-y-6">
        {seasons.map((season) => (
          <div key={season.id} className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">{season.label}</h2>
              <Link href={`/portal/admin/analytics/seasons/${season.id}`} className="text-sm font-medium text-primary hover:underline">
                Season report →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {season.camps.map((camp) => (
                <Link
                  key={camp.id}
                  href={`/portal/admin/analytics/camps/${camp.id}`}
                  className="rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-primary/40 hover:bg-background/60"
                >
                  <p className="font-semibold text-foreground">{camp.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">View camp report</p>
                </Link>
              ))}
              {season.camps.length === 0 && <p className="text-sm text-muted-foreground">No camps in this season yet.</p>}
            </div>
          </div>
        ))}
        {seasons.length === 0 && <p className="text-muted-foreground">No seasons yet.</p>}
      </div>
    </div>
  );
}
