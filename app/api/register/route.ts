import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { sendPendingPaymentEmail, sendWaitlistEmail } from '@/lib/email';
import { recordEmailResult } from '@/lib/registration-email';
import { getMeetingPoints } from '@/lib/queries/site-settings';
import { isRateLimited } from '@/lib/rate-limit';
import { validateRegistrationInput, gradeOptionsForCamp } from '@/lib/validation/registration';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`register-submit:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later or contact support.' }, { status: 429 });
  }

  const body = await request.json();

  const required = [
    'campSlug', 'camperName', 'dateOfBirth', 'mobilePhone', 'email', 'school', 'academicYear', 'tshirtSize',
    'parentName', 'parentMobile', 'parentEmail', 'emergencyContactName', 'emergencyContactNumber',
  ];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === '') {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const validationError = validateRegistrationInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fresh read, never trust the ISR-cached camp/spots-left the client saw —
  // capacity can have changed in the last few minutes of cache staleness.
  const { data: camp, error: campError } = await supabase
    .from('camps')
    .select('id, slug, capacity, status, price_egp, date_start, date_end, camp_types(name)')
    .eq('slug', body.campSlug)
    .maybeSingle();

  if (campError) return NextResponse.json({ error: campError.message }, { status: 500 });
  if (!camp || camp.status === 'closed') {
    return NextResponse.json({ error: 'This camp is no longer accepting registrations.' }, { status: 409 });
  }

  const campTypeRel = camp.camp_types as { name: string } | { name: string }[] | null;
  const campTypeName = (Array.isArray(campTypeRel) ? campTypeRel[0]?.name : campTypeRel?.name) ?? '';
  if (!gradeOptionsForCamp(campTypeName).includes(String(body.academicYear).trim())) {
    return NextResponse.json({ error: `That grade isn't available for ${campTypeName || 'this camp'}.` }, { status: 400 });
  }

  const { count: filledCount, error: countError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('camp_id', camp.id)
    .in('status', ['confirmed', 'payment_submitted']);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const spotsLeft = camp.capacity - (filledCount ?? 0);
  const willWaitlist = spotsLeft <= 0;

  let waitlistPosition: number | null = null;
  if (willWaitlist) {
    const { count: waitlistCount, error: waitlistError } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', camp.id)
      .eq('status', 'waitlisted');
    if (waitlistError) return NextResponse.json({ error: waitlistError.message }, { status: 500 });
    waitlistPosition = (waitlistCount ?? 0) + 1;
  }

  const { data: regNumber, error: rpcError } = await supabase.rpc('generate_registration_number');
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  const { data: registration, error: insertError } = await supabase
    .from('registrations')
    .insert({
      registration_number: regNumber,
      camp_id: camp.id,
      status: willWaitlist ? 'waitlisted' : 'pending_payment',
      waitlist_position: waitlistPosition,
      camper_name: body.camperName,
      date_of_birth: body.dateOfBirth,
      mobile_phone: body.mobilePhone,
      email: body.email,
      school: body.school,
      academic_year: body.academicYear,
      tshirt_size: body.tshirtSize,
      parent_name: body.parentName,
      parent_mobile: body.parentMobile,
      alternate_mobile: body.alternateMobile || null,
      parent_email: body.parentEmail,
      first_time_camper: Boolean(body.firstTimeCamper),
      emergency_contact_name: body.emergencyContactName,
      emergency_contact_number: body.emergencyContactNumber,
      medical_condition: body.medicalCondition || null,
      additional_info: body.additionalInfo || null,
    })
    .select('id, registration_number, status, waitlist_position')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Best-effort — a failed email should never fail a registration that
  // already succeeded, but the outcome IS recorded (email_status /
  // email_failure_reason) so staff can see and resend it from the portal.
  try {
    const typeRel = camp.camp_types as { name: string } | { name: string }[] | null;
    const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'the camp';

    const result = registration.status === 'waitlisted'
      ? await sendWaitlistEmail({
          to: body.parentEmail,
          camperName: body.camperName,
          registrationNumber: registration.registration_number,
          campName,
          waitlistPosition: registration.waitlist_position ?? 0,
        })
      : await sendPendingPaymentEmail({
          to: body.parentEmail,
          camperName: body.camperName,
          mobilePhone: body.mobilePhone,
          registrationNumber: registration.registration_number,
          campName,
          campSlug: camp.slug,
          priceEgp: camp.price_egp,
          meetingPoints: await getMeetingPoints(),
        });

    await recordEmailResult(supabase, registration.id, result);
  } catch (emailError) {
    console.error('[register] confirmation email failed', emailError);
    await recordEmailResult(supabase, registration.id, { status: 'failed', reason: emailError instanceof Error ? emailError.message : 'Unknown error', failureType: 'other' });
  }

  return NextResponse.json({ registration });
}
