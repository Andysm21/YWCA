import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { getOrCreateCampFolders, uploadFileToDrive } from '@/lib/google-drive';
import { sendWaitlistEmail } from '@/lib/email';
import { recordEmailResult } from '@/lib/registration-email';
import { isRateLimited } from '@/lib/rate-limit';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_PREFIX = 'image/';

const STATUS_MESSAGES: Record<string, string> = {
  payment_submitted: 'This registration already has payment submitted — no need to resubmit.',
  confirmed: 'This registration is already confirmed.',
  refunded: 'This registration was refunded. Contact support if that seems wrong.',
  waitlisted: "This registration is on the waitlist — there's no payment to submit yet. We'll email you if a spot opens up.",
};

function validateFile(file: FormDataEntryValue | null, label: string): string | null {
  if (!file || !(file instanceof File)) return `${label} is required.`;
  if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) return `${label} must be an image file.`;
  if (file.size > MAX_FILE_BYTES) return `${label} must be 10MB or smaller.`;
  if (file.size === 0) return `${label} is empty.`;
  return null;
}

/**
 * Client-supplied `file.type` is trivially spoofable (a renamed .exe with
 * type="image/png" sails through validateFile above). This checks the
 * actual bytes against known image magic numbers instead of trusting the
 * MIME type — no new dependency needed, the signatures are tiny and fixed.
 */
function sniffImageType(bytes: Uint8Array): 'png' | 'jpeg' | 'webp' | null {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // "RIFF"
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // "WEBP"
  ) {
    return 'webp';
  }
  return null;
}

async function validateFileContent(file: File, label: string): Promise<string | null> {
  const buffer = await file.arrayBuffer();
  const type = sniffImageType(new Uint8Array(buffer.slice(0, 12)));
  if (!type) {
    return `${label} does not look like a valid image file (PNG, JPEG, or WebP).`;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(`register-payment:${ip}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later or contact support.' }, { status: 429 });
    }

    const formData = await request.formData();
    const registrationNumber = String(formData.get('registrationNumber') ?? '').trim();
    const certificate = formData.get('certificate');
    const paymentScreenshot = formData.get('paymentScreenshot');

    if (!registrationNumber) {
      return NextResponse.json({ error: 'Registration number is required.' }, { status: 400 });
    }

    const certError = validateFile(certificate, 'Certificate');
    if (certError) return NextResponse.json({ error: certError }, { status: 400 });
    const paymentError = validateFile(paymentScreenshot, 'Payment screenshot');
    if (paymentError) return NextResponse.json({ error: paymentError }, { status: 400 });

    // Content-sniff both files (magic bytes) — the checks above only look
    // at the client-supplied MIME type, which is trivially spoofable.
    const certContentError = await validateFileContent(certificate as File, 'Certificate');
    if (certContentError) return NextResponse.json({ error: certContentError }, { status: 400 });
    const paymentContentError = await validateFileContent(paymentScreenshot as File, 'Payment screenshot');
    if (paymentContentError) return NextResponse.json({ error: paymentContentError }, { status: 400 });

    const supabase = createServiceClient();

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, status, camp_id, camper_name, parent_email, camps(capacity, camp_types(name), seasons(year, type))')
      .eq('registration_number', registrationNumber)
      .maybeSingle();
    if (regError) return NextResponse.json({ error: regError.message }, { status: 500 });
    if (!registration) {
      return NextResponse.json({ error: 'No registration found with that number. Double-check it, or use "lost my code" below.' }, { status: 404 });
    }

    if (registration.status !== 'pending_payment') {
      return NextResponse.json(
        { error: STATUS_MESSAGES[registration.status] ?? 'This registration cannot accept a payment submission right now.' },
        { status: 409 }
      );
    }

    type CampTypeRel = { name: string } | { name: string }[] | null;
    type SeasonRel = { year: number; type: string } | { year: number; type: string }[] | null;
    type CampRel = { capacity: number; camp_types: CampTypeRel; seasons: SeasonRel };
    const campRel = registration.camps as CampRel | CampRel[] | null;
    const camp = Array.isArray(campRel) ? campRel[0] : campRel;
    if (!camp) return NextResponse.json({ error: 'Camp not found for this registration.' }, { status: 500 });
    const typeRel = camp.camp_types;
    const campName = (Array.isArray(typeRel) ? typeRel[0]?.name : typeRel?.name) ?? 'Unknown Camp';
    const seasonRel = camp.seasons;
    const season = Array.isArray(seasonRel) ? seasonRel[0] : seasonRel;
    if (!season) return NextResponse.json({ error: 'Season not found for this registration.' }, { status: 500 });
    const seasonName = `${season.type === 'winter' ? 'Winter' : 'Summer'} ${season.year}`;

    // Re-verify capacity here too — this is the whole point of Step 2 being
    // a separate step. Between Step 1 (pending_payment, doesn't count
    // toward capacity per the schema's state machine) and now, other
    // registrations may have gone payment_submitted/confirmed, or a
    // waitlist promotion may have happened, and filled the camp. Never
    // trust that a spot reserved at Step 1 is still available at Step 2.
    const { count: filledCount, error: countError } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', registration.camp_id)
      .in('status', ['confirmed', 'payment_submitted']);
    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

    if ((filledCount ?? 0) >= camp.capacity) {
      // Camp filled up since Step 1 — move to waitlist instead of accepting
      // documents for a spot that no longer exists. Files are NOT uploaded;
      // nothing to do with them for a waitlisted registration.
      const { count: waitlistCount, error: waitlistCountError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('camp_id', registration.camp_id)
        .eq('status', 'waitlisted');
      if (waitlistCountError) return NextResponse.json({ error: waitlistCountError.message }, { status: 500 });

      const newWaitlistPosition = (waitlistCount ?? 0) + 1;
      const { error: waitlistUpdateError } = await supabase
        .from('registrations')
        .update({ status: 'waitlisted', waitlist_position: newWaitlistPosition })
        .eq('id', registration.id);
      if (waitlistUpdateError) return NextResponse.json({ error: waitlistUpdateError.message }, { status: 500 });

      // This registrant needs the same waitlist email Step 1 sends when the
      // camp is already full at initial registration — this branch is the
      // "filled up WHILE they were on Step 2" case, so without this they'd
      // silently drop off the waitlist notification path entirely (bug
      // fixed 2026 waitlist audit: this send was previously missing here).
      try {
        const result = await sendWaitlistEmail({
          to: registration.parent_email,
          camperName: registration.camper_name,
          registrationNumber,
          campName,
          waitlistPosition: newWaitlistPosition,
        });
        await recordEmailResult(supabase, registration.id, result);
      } catch (emailError) {
        console.error('[register/payment] waitlist email failed', emailError);
        await recordEmailResult(supabase, registration.id, { status: 'failed', reason: emailError instanceof Error ? emailError.message : 'Unknown error', failureType: 'other' });
      }

      return NextResponse.json(
        { waitlisted: true, message: `${campName} filled up while your payment was pending. You've been moved to the waitlist — we'll email you if a spot opens up.` },
        { status: 200 }
      );
    }

    const { certificatesFolderId, paymentsFolderId } = await getOrCreateCampFolders(seasonName, campName);

    const certificateFile = certificate as File;
    const paymentFile = paymentScreenshot as File;

    const [certUpload, paymentUpload] = await Promise.all([
      uploadFileToDrive(certificatesFolderId, `${registrationNumber}-certificate-${certificateFile.name}`, certificateFile.type, Buffer.from(await certificateFile.arrayBuffer())),
      uploadFileToDrive(paymentsFolderId, `${registrationNumber}-payment-${paymentFile.name}`, paymentFile.type, Buffer.from(await paymentFile.arrayBuffer())),
    ]);

    const { error: docsError } = await supabase.from('registration_documents').insert([
      {
        registration_id: registration.id,
        type: 'certificate',
        drive_file_id: certUpload.driveFileId,
        drive_file_url: certUpload.driveFileUrl,
        file_name: certificateFile.name,
        file_size_bytes: certificateFile.size,
      },
      {
        registration_id: registration.id,
        type: 'payment_screenshot',
        drive_file_id: paymentUpload.driveFileId,
        drive_file_url: paymentUpload.driveFileUrl,
        file_name: paymentFile.name,
        file_size_bytes: paymentFile.size,
      },
    ]);
    if (docsError) return NextResponse.json({ error: `Files uploaded but failed to save: ${docsError.message}` }, { status: 500 });

    // Conditional on status still being pending_payment — closes the TOCTOU
    // gap between the status check above and this write (two tabs / a
    // retried request racing each other could both pass that check before
    // either writes). If zero rows match, another request already won the
    // race and flipped this registration's status first; the documents
    // from THIS request were still uploaded to Drive (harmless duplicate,
    // not surfaced to the guest) but the registration itself is not
    // double-transitioned.
    const { data: updatedRows, error: statusError } = await supabase
      .from('registrations')
      .update({ status: 'payment_submitted' })
      .eq('id', registration.id)
      .eq('status', 'pending_payment')
      .select('id');
    if (statusError) return NextResponse.json({ error: `Documents saved but status update failed: ${statusError.message}` }, { status: 500 });
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: 'This registration was already submitted (possibly from another tab or a retry). No need to resubmit — refresh the page to see its current status.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[register/payment]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
