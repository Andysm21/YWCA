import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireStaff } from '@/lib/auth/require-staff';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending payment',
  payment_submitted: 'Payment submitted',
  confirmed: 'Confirmed',
  waitlisted: 'Waitlisted',
  refunded: 'Refunded',
};
const STATUS_FILL: Record<string, string> = {
  confirmed: 'FFD1FAE5',
  payment_submitted: 'FFFEF3C7',
  pending_payment: 'FFE0F2FE',
  waitlisted: 'FFFFE4E6',
  refunded: 'FFE4E4E7',
};

const yesNo = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : '');
const asDate = (v: unknown) => (v ? new Date(String(v)) : null);

/**
 * Full Excel export of registrations (every stored field, camp + season info,
 * links to the uploaded documents) — all matching rows, not just one page.
 * Filters: camp, status, q (same search as the camp page). Staff only.
 */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(request.url);
  const campId = url.searchParams.get('camp');
  const status = url.searchParams.get('status');
  const q = url.searchParams.get('q')?.trim().replace(/[%,()*]/g, ' ');
  const siteOrigin = url.origin;

  try {
    const rows: any[] = [];
    for (let from = 0; ; from += 1000) {
      let query = supabase
        .from('registrations')
        .select('*, camps(slug, price_egp, capacity, date_start, date_end, camp_types(name), seasons(type, year))')
        .order('created_at', { ascending: true })
        .range(from, from + 999);
      if (campId && campId !== 'all') query = query.eq('camp_id', campId);
      if (status && status !== 'all') query = query.eq('status', status);
      if (q) {
        const like = `%${q}%`;
        query = query.or(['camper_name', 'parent_name', 'email', 'parent_email', 'mobile_phone', 'parent_mobile', 'registration_number', 'school'].map((c) => `${c}.ilike.${like}`).join(','));
      }
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }

    const ids = rows.map((r) => r.id);
    const docsByReg = new Map<string, any[]>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data: docs, error } = await supabase
        .from('registration_documents')
        .select('id, registration_id, type, drive_file_url, file_name')
        .in('registration_id', ids.slice(i, i + 200));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      for (const d of docs ?? []) {
        const list = docsByReg.get(d.registration_id) ?? [];
        list.push(d);
        docsByReg.set(d.registration_id, list);
      }
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'YWCA Camp';
    wb.created = new Date();

    // ---- Sheet 1: every registration, every field ----
    const ws = wb.addWorksheet('Registrations', { views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }] });
    ws.columns = [
      { header: 'Reg #', key: 'reg', width: 16 },
      { header: 'Camper', key: 'camper', width: 26 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Camp', key: 'camp', width: 18 },
      { header: 'Season', key: 'season', width: 14 },
      { header: 'Camp start', key: 'start', width: 12 },
      { header: 'Camp end', key: 'end', width: 12 },
      { header: 'Price (EGP)', key: 'price', width: 12 },
      { header: 'Waitlist #', key: 'wl', width: 10 },
      { header: 'Birth date', key: 'dob', width: 12 },
      { header: 'Grade / academic year', key: 'grade', width: 20 },
      { header: 'School', key: 'school', width: 26 },
      { header: 'T-shirt size', key: 'tshirt', width: 12 },
      { header: 'Bus pickup', key: 'bus', width: 34 },
      { header: 'First-time camper', key: 'first', width: 14 },
      { header: 'Camper mobile', key: 'cmobile', width: 18 },
      { header: 'Camper email', key: 'cemail', width: 28 },
      { header: 'Guardian', key: 'parent', width: 24 },
      { header: 'Guardian mobile', key: 'pmobile', width: 18 },
      { header: 'Alternate mobile', key: 'amobile', width: 18 },
      { header: 'Guardian email', key: 'pemail', width: 28 },
      { header: 'Emergency contact', key: 'ename', width: 24 },
      { header: 'Emergency number', key: 'enumber', width: 18 },
      { header: 'Medical conditions', key: 'medical', width: 36 },
      { header: 'Additional info', key: 'extra', width: 36 },
      { header: 'Registered at', key: 'created', width: 18 },
      { header: 'Confirmed at', key: 'confirmed', width: 18 },
      { header: 'Promoted from waitlist', key: 'promoted', width: 18 },
      { header: 'Refunded at', key: 'refunded', width: 18 },
      { header: 'Refund reason', key: 'reason', width: 30 },
      { header: 'Email status', key: 'email', width: 12 },
      { header: 'Email failure reason', key: 'emailfail', width: 30 },
      { header: 'Birth certificate', key: 'cert', width: 22 },
      { header: 'Payment proof', key: 'pay', width: 22 },
    ];

    for (const r of rows) {
      const camp = Array.isArray(r.camps) ? r.camps[0] : r.camps;
      const typeRel = camp?.camp_types;
      const seasonRel = camp?.seasons;
      const season = Array.isArray(seasonRel) ? seasonRel[0] : seasonRel;
      const docs = docsByReg.get(r.id) ?? [];
      const cert = docs.find((d) => d.type === 'certificate');
      const pay = docs.find((d) => d.type === 'payment_screenshot');
      const row = ws.addRow({
        reg: r.registration_number,
        camper: r.camper_name,
        status: STATUS_LABEL[r.status] ?? r.status,
        camp: (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? '',
        season: season ? `${season.type === 'winter' ? 'Winter' : 'Summer'} ${season.year}` : '',
        start: asDate(camp?.date_start),
        end: asDate(camp?.date_end),
        price: camp?.price_egp ?? null,
        wl: r.waitlist_position ?? '',
        dob: asDate(r.date_of_birth),
        grade: r.academic_year ?? '',
        school: r.school ?? '',
        tshirt: r.tshirt_size ?? '',
        bus: r.bus_pickup ?? '',
        first: yesNo(r.first_time_camper),
        cmobile: r.mobile_phone ?? '',
        cemail: r.email ?? '',
        parent: r.parent_name ?? '',
        pmobile: r.parent_mobile ?? '',
        amobile: r.alternate_mobile ?? '',
        pemail: r.parent_email ?? '',
        ename: r.emergency_contact_name ?? '',
        enumber: r.emergency_contact_number ?? '',
        medical: r.medical_condition ?? '',
        extra: r.additional_info ?? '',
        created: asDate(r.created_at),
        confirmed: asDate(r.confirmed_at),
        promoted: asDate(r.promoted_from_waitlist_at),
        refunded: asDate(r.refunded_at),
        reason: r.refund_reason ?? '',
        email: r.email_status ?? '',
        emailfail: r.email_failure_reason ?? '',
      });
      // In-site links (staff must be logged in to the portal to open them).
      if (cert) row.getCell('cert').value = { text: 'Open file', hyperlink: `${siteOrigin}/api/portal/registrations/${r.id}/documents/${cert.id}` };
      if (pay) row.getCell('pay').value = { text: 'Open file', hyperlink: `${siteOrigin}/api/portal/registrations/${r.id}/documents/${pay.id}` };
      for (const key of ['cert', 'pay'] as const) {
        const cell = row.getCell(key);
        if (cell.value && typeof cell.value === 'object') cell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
      }
      row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_FILL[r.status] ?? 'FFFFFFFF' } };
      row.alignment = { vertical: 'top', wrapText: true };
    }

    for (const key of ['start', 'end', 'dob']) ws.getColumn(key).numFmt = 'dd mmm yyyy';
    for (const key of ['created', 'confirmed', 'promoted', 'refunded']) ws.getColumn(key).numFmt = 'dd mmm yyyy hh:mm';
    ws.getColumn('price').numFmt = '#,##0';

    const head = ws.getRow(1);
    head.height = 30;
    head.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B1F3A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };

    // ---- Sheet 2: summary per camp ----
    const sum = wb.addWorksheet('Summary');
    sum.columns = [
      { header: 'Camp', key: 'camp', width: 24 },
      { header: 'Season', key: 'season', width: 14 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Confirmed', key: 'confirmed', width: 12 },
      { header: 'Payment submitted', key: 'submitted', width: 18 },
      { header: 'Pending payment', key: 'pending', width: 16 },
      { header: 'Waitlisted', key: 'waitlisted', width: 12 },
      { header: 'Refunded', key: 'refunded', width: 12 },
      { header: 'Capacity', key: 'capacity', width: 10 },
      { header: 'Confirmed revenue (EGP)', key: 'revenue', width: 24 },
    ];
    const byCamp = new Map<string, any>();
    for (const r of rows) {
      const camp = Array.isArray(r.camps) ? r.camps[0] : r.camps;
      const typeRel = camp?.camp_types;
      const seasonRel = camp?.seasons;
      const season = Array.isArray(seasonRel) ? seasonRel[0] : seasonRel;
      const e = byCamp.get(r.camp_id) ?? {
        camp: (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? '',
        season: season ? `${season.type === 'winter' ? 'Winter' : 'Summer'} ${season.year}` : '',
        total: 0, confirmed: 0, submitted: 0, pending: 0, waitlisted: 0, refunded: 0,
        capacity: camp?.capacity ?? '', revenue: 0,
      };
      e.total += 1;
      if (r.status === 'confirmed') { e.confirmed += 1; e.revenue += camp?.price_egp ?? 0; }
      if (r.status === 'payment_submitted') e.submitted += 1;
      if (r.status === 'pending_payment') e.pending += 1;
      if (r.status === 'waitlisted') e.waitlisted += 1;
      if (r.status === 'refunded') e.refunded += 1;
      byCamp.set(r.camp_id, e);
    }
    for (const e of Array.from(byCamp.values())) sum.addRow(e);
    sum.getColumn('revenue').numFmt = '#,##0';
    sum.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8531E' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const campLabel = rows[0] && campId && campId !== 'all'
      ? String((Array.isArray(rows[0].camps?.camp_types) ? rows[0].camps.camp_types[0]?.name : rows[0].camps?.camp_types?.name) ?? 'camp').replace(/[^a-z0-9]+/gi, '-')
      : 'all-camps';
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="YWCA-Registrations-${campLabel}-${stamp}.xlsx"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[registrations export]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Export failed' }, { status: 500 });
  }
}
