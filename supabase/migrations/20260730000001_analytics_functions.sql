/*
# Analytics aggregate functions

## Summary
Two read-only RPCs backing the portal Analytics pages (Admin + Super
Admin — read-only reporting fits Admin's existing scope). Both do all
aggregation IN Postgres (COUNT/SUM/GROUP BY, single query each) and
return one small JSON object/array — never full registration rows. This
matters specifically because of the free-tier Supabase egress budget this
project has been designed around throughout: a naive "fetch all
registrations for this camp then reduce in JS" implementation would scale
egress linearly with registration count for every analytics page view;
these functions scale with camp/season COUNT regardless of row count.

## Access control
SECURITY DEFINER + an explicit `is_admin()` guard inside each function
(same pattern as the rest of this schema's staff-only RPCs) — callable by
any authenticated staff session (admin or super_admin), raises otherwise.
Not exposed to anon/guest at all.
*/

CREATE OR REPLACE FUNCTION public.get_camp_analytics(p_camp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH agg AS (
    SELECT
      r.camp_id,
      jsonb_object_agg(r.status, r.status_count) AS status_counts,
      SUM(r.status_count) FILTER (WHERE r.status IN ('confirmed', 'payment_submitted')) AS filled_count,
      SUM(r.status_count) FILTER (WHERE r.status = 'waitlisted') AS waitlist_count,
      SUM(r.status_count) FILTER (WHERE r.status = 'refunded') AS refund_count
    FROM (
      SELECT camp_id, status, COUNT(*) AS status_count
      FROM registrations
      WHERE camp_id = p_camp_id
      GROUP BY camp_id, status
    ) r
    GROUP BY r.camp_id
  ),
  rev AS (
    SELECT
      r.camp_id,
      SUM(c2.price_egp) FILTER (WHERE r.status = 'confirmed') AS confirmed_revenue,
      SUM(c2.price_egp) FILTER (WHERE r.status = 'payment_submitted') AS pending_revenue,
      SUM(c2.price_egp) FILTER (WHERE r.status = 'refunded') AS refunded_amount,
      COUNT(*) FILTER (WHERE r.email_status = 'failed') AS failed_email_count
    FROM registrations r
    JOIN camps c2 ON c2.id = r.camp_id
    WHERE r.camp_id = p_camp_id
    GROUP BY r.camp_id
  )
  SELECT jsonb_build_object(
    'camp_id', c.id,
    'capacity', c.capacity,
    'status_counts', COALESCE(agg.status_counts, '{}'::jsonb),
    'filled_count', COALESCE(agg.filled_count, 0),
    'fill_rate_pct', CASE WHEN c.capacity > 0
      THEN ROUND(COALESCE(agg.filled_count, 0)::numeric / c.capacity * 100, 1)
      ELSE 0 END,
    'waitlist_size', COALESCE(agg.waitlist_count, 0),
    'confirmed_revenue_egp', COALESCE(rev.confirmed_revenue, 0),
    'pending_confirmation_revenue_egp', COALESCE(rev.pending_revenue, 0),
    'refund_count', COALESCE(agg.refund_count, 0),
    'refunded_amount_egp', COALESCE(rev.refunded_amount, 0),
    'failed_email_count', COALESCE(rev.failed_email_count, 0)
  ) INTO result
  FROM camps c
  LEFT JOIN agg ON agg.camp_id = c.id
  LEFT JOIN rev ON rev.camp_id = c.id
  WHERE c.id = p_camp_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_season_analytics(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'season_id', p_season_id,
    'total_registrations', COALESCE(SUM(camp_totals.total_registrations), 0),
    'total_confirmed_revenue_egp', COALESCE(SUM(camp_totals.confirmed_revenue), 0),
    'total_pending_confirmation_revenue_egp', COALESCE(SUM(camp_totals.pending_revenue), 0),
    'total_refund_count', COALESCE(SUM(camp_totals.refund_count), 0),
    'total_refunded_amount_egp', COALESCE(SUM(camp_totals.refunded_amount), 0),
    'total_waitlist_size', COALESCE(SUM(camp_totals.waitlist_count), 0),
    'camps', COALESCE(jsonb_agg(
      jsonb_build_object(
        'camp_id', camp_totals.camp_id,
        'camp_name', camp_totals.camp_name,
        'capacity', camp_totals.capacity,
        'filled_count', camp_totals.filled_count,
        'fill_rate_pct', camp_totals.fill_rate_pct,
        'waitlist_size', camp_totals.waitlist_count,
        'confirmed_revenue_egp', camp_totals.confirmed_revenue,
        'pending_confirmation_revenue_egp', camp_totals.pending_revenue,
        'refund_count', camp_totals.refund_count,
        'refunded_amount_egp', camp_totals.refunded_amount
      ) ORDER BY camp_totals.camp_name
    ), '[]'::jsonb)
  ) INTO result
  FROM (
    SELECT
      c.id AS camp_id,
      ct.name AS camp_name,
      c.capacity,
      COALESCE(sc.total_registrations, 0) AS total_registrations,
      COALESCE(sc.filled_count, 0) AS filled_count,
      CASE WHEN c.capacity > 0 THEN ROUND(COALESCE(sc.filled_count, 0)::numeric / c.capacity * 100, 1) ELSE 0 END AS fill_rate_pct,
      COALESCE(sc.waitlist_count, 0) AS waitlist_count,
      COALESCE(sc.refund_count, 0) AS refund_count,
      COALESCE(rev.confirmed_revenue, 0) AS confirmed_revenue,
      COALESCE(rev.pending_revenue, 0) AS pending_revenue,
      COALESCE(rev.refunded_amount, 0) AS refunded_amount
    FROM camps c
    JOIN camp_types ct ON ct.id = c.camp_type_id
    LEFT JOIN (
      SELECT
        camp_id,
        COUNT(*) AS total_registrations,
        SUM(status_count) FILTER (WHERE status IN ('confirmed', 'payment_submitted')) AS filled_count,
        SUM(status_count) FILTER (WHERE status = 'waitlisted') AS waitlist_count,
        SUM(status_count) FILTER (WHERE status = 'refunded') AS refund_count
      FROM (
        SELECT camp_id, status, COUNT(*) AS status_count
        FROM registrations
        WHERE camp_id IN (SELECT id FROM camps WHERE season_id = p_season_id)
        GROUP BY camp_id, status
      ) per_status
      GROUP BY camp_id
    ) sc ON sc.camp_id = c.id
    LEFT JOIN (
      SELECT
        r.camp_id,
        SUM(c2.price_egp) FILTER (WHERE r.status = 'confirmed') AS confirmed_revenue,
        SUM(c2.price_egp) FILTER (WHERE r.status = 'payment_submitted') AS pending_revenue,
        SUM(c2.price_egp) FILTER (WHERE r.status = 'refunded') AS refunded_amount
      FROM registrations r
      JOIN camps c2 ON c2.id = r.camp_id
      WHERE r.camp_id IN (SELECT id FROM camps WHERE season_id = p_season_id)
      GROUP BY r.camp_id
    ) rev ON rev.camp_id = c.id
    WHERE c.season_id = p_season_id
  ) camp_totals;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_camp_analytics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_season_analytics(uuid) TO authenticated;
