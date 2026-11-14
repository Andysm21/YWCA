import type { Camp } from '@/lib/camp-data';
import { formatCairo } from '@/lib/time-cairo';

/** Portal label for a camp's visibility / registration state. */
export function describeCampState(camp: Pick<Camp, 'dbStatus' | 'opensAt'>): { label: string; detail?: string; tone: 'hidden' | 'scheduled' | 'soon' | 'open' } {
  if (camp.dbStatus === 'open') return { label: 'Open', detail: 'Visible · registration open', tone: 'open' };
  if (camp.dbStatus === 'coming_soon') return { label: 'Coming soon', detail: 'Visible to guests', tone: 'soon' };
  if (camp.opensAt) return { label: 'Scheduled', detail: `Opens ${formatCairo(camp.opensAt)} (Egypt time)`, tone: 'scheduled' };
  return { label: 'Hidden', detail: 'Not visible · registration closed', tone: 'hidden' };
}
