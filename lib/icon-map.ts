import {
  Users,
  HeartHandshake,
  Compass,
  Sparkles,
  Sun,
  Snowflake,
  Waves,
  Mountain,
  Star,
  type LucideIcon,
} from 'lucide-react';
import type { CampIconName, SeasonIconName } from '@/lib/camp-data';

/**
 * Resolves a Camp's/Season's serializable icon NAME back to an actual
 * component — call this client-side (inside a 'use client' component),
 * never store the result in a value that gets passed as a prop from a
 * Server Component (see the comment on CampIconName in lib/camp-data.ts).
 */
const CAMP_ICONS: Record<CampIconName, LucideIcon> = {
  sparkles: Sparkles,
  users: Users,
  'heart-handshake': HeartHandshake,
  compass: Compass,
  sun: Sun,
  waves: Waves,
  mountain: Mountain,
  star: Star,
};

const SEASON_ICONS: Record<SeasonIconName, LucideIcon> = {
  sun: Sun,
  snowflake: Snowflake,
};

export function getCampIcon(name: CampIconName): LucideIcon {
  return CAMP_ICONS[name];
}

export function getSeasonIcon(name: SeasonIconName): LucideIcon {
  return SEASON_ICONS[name];
}
