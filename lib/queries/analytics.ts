import 'server-only';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type CampAnalytics = {
  campId: string;
  capacity: number;
  statusCounts: Partial<Record<'pending_payment' | 'waitlisted' | 'payment_submitted' | 'confirmed' | 'refunded', number>>;
  filledCount: number;
  fillRatePct: number;
  waitlistSize: number;
  confirmedRevenueEgp: number;
  pendingConfirmationRevenueEgp: number;
  refundCount: number;
  refundedAmountEgp: number;
  failedEmailCount: number;
};

export type SeasonCampSummary = {
  campId: string;
  campName: string;
  capacity: number;
  filledCount: number;
  fillRatePct: number;
  waitlistSize: number;
  confirmedRevenueEgp: number;
  pendingConfirmationRevenueEgp: number;
  refundCount: number;
  refundedAmountEgp: number;
};

export type SeasonAnalytics = {
  seasonId: string;
  totalRegistrations: number;
  totalConfirmedRevenueEgp: number;
  totalPendingConfirmationRevenueEgp: number;
  totalRefundCount: number;
  totalRefundedAmountEgp: number;
  totalWaitlistSize: number;
  camps: SeasonCampSummary[];
};

/**
 * Both RPCs (supabase/migrations/20260730000001_analytics_functions.sql)
 * do all aggregation in Postgres — COUNT/SUM/GROUP BY over `registrations`,
 * one query, one small JSON object back. This deliberately avoids the
 * naive "fetch every registration row for this camp/season and reduce in
 * JS" approach, which would scale egress with registration count on every
 * analytics page view — a real cost concern on Supabase's free-tier
 * egress budget this project has been designed around throughout.
 *
 * Uses the cookie-authenticated client (not service-role) — the RPCs
 * themselves enforce is_admin() server-side via SECURITY DEFINER, so a
 * non-staff caller gets a Postgres exception, not just an RLS-filtered
 * empty result.
 */
export async function getCampAnalytics(campId: string): Promise<CampAnalytics | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data, error } = await supabase.rpc('get_camp_analytics', { p_camp_id: campId });
  if (error) throw error;
  if (!data) return null;

  return {
    campId: data.camp_id,
    capacity: data.capacity,
    statusCounts: data.status_counts ?? {},
    filledCount: data.filled_count ?? 0,
    fillRatePct: Number(data.fill_rate_pct ?? 0),
    waitlistSize: data.waitlist_size ?? 0,
    confirmedRevenueEgp: Number(data.confirmed_revenue_egp ?? 0),
    pendingConfirmationRevenueEgp: Number(data.pending_confirmation_revenue_egp ?? 0),
    refundCount: data.refund_count ?? 0,
    refundedAmountEgp: Number(data.refunded_amount_egp ?? 0),
    failedEmailCount: data.failed_email_count ?? 0,
  };
}

export async function getSeasonAnalytics(seasonId: string): Promise<SeasonAnalytics | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data, error } = await supabase.rpc('get_season_analytics', { p_season_id: seasonId });
  if (error) throw error;
  if (!data) return null;

  return {
    seasonId: data.season_id,
    totalRegistrations: data.total_registrations ?? 0,
    totalConfirmedRevenueEgp: Number(data.total_confirmed_revenue_egp ?? 0),
    totalPendingConfirmationRevenueEgp: Number(data.total_pending_confirmation_revenue_egp ?? 0),
    totalRefundCount: data.total_refund_count ?? 0,
    totalRefundedAmountEgp: Number(data.total_refunded_amount_egp ?? 0),
    totalWaitlistSize: data.total_waitlist_size ?? 0,
    camps: (data.camps ?? []).map((c: any) => ({
      campId: c.camp_id,
      campName: c.camp_name,
      capacity: c.capacity,
      filledCount: c.filled_count ?? 0,
      fillRatePct: Number(c.fill_rate_pct ?? 0),
      waitlistSize: c.waitlist_size ?? 0,
      confirmedRevenueEgp: Number(c.confirmed_revenue_egp ?? 0),
      pendingConfirmationRevenueEgp: Number(c.pending_confirmation_revenue_egp ?? 0),
      refundCount: c.refund_count ?? 0,
      refundedAmountEgp: Number(c.refunded_amount_egp ?? 0),
    })),
  };
}
