import 'server-only';
import nodemailer from 'nodemailer';

/**
 * Separate from Supabase Auth's SMTP config (that one sends invite/recovery
 * emails via Supabase's own mailer settings) — this is the application's
 * own transporter for registration confirmation emails, using the same
 * Gmail account/app password but configured independently here.
 */
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD not set');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export type EmailFailureType = 'quota_exceeded' | 'invalid_address' | 'other';
export type SendResult = { status: 'sent' } | { status: 'failed'; reason: string; failureType: EmailFailureType };

/**
 * Distinguishes Gmail's daily-sending-quota error from every other SMTP
 * failure, since the two need opposite handling: a quota failure is
 * transient and worth auto-retrying after the daily reset; a bad-address
 * failure will never succeed no matter how many times it's retried.
 *
 * This matches the ACTUAL documented Gmail SMTP response for the daily
 * sending limit, not a guess — Google's own support article
 * (https://support.google.com/mail/?p=DailyLimit) is quoted verbatim
 * inside the SMTP response text itself:
 *
 *   550-5.4.5 Daily user sending limit exceeded. For more information on Gmail
 *   550-5.4.5 sending limits go to
 *   550 5.4.5 https://support.google.com/mail/?p=DailyLimit
 *
 * nodemailer's SMTP transport surfaces this as a rejected sendMail()
 * promise with `err.responseCode` (550) and the full multi-line text in
 * `err.response`. Matched on the enhanced status code (5.4.5) together
 * with the "Daily" wording AND/OR the literal support-article URL
 * fragment — that URL only ever appears in this specific error, so it's
 * the most reliable anchor if Google ever tweaks the surrounding wording.
 * (Distinct from a rejected-recipient error, which uses a different
 * enhanced code — 5.1.1 "no such user" — and is handled separately below
 * via nodemailer's `info.rejected`.)
 */
function classifySmtpError(err: unknown): { failureType: EmailFailureType; reason: string } {
  const anyErr = err as { responseCode?: number; response?: string; message?: string } | undefined;
  const response = anyErr?.response ?? '';
  const isQuotaExceeded =
    anyErr?.responseCode === 550 &&
    /5\.4\.5/.test(response) &&
    (/daily/i.test(response) || response.includes('support.google.com/mail/?p=DailyLimit'));

  if (isQuotaExceeded) {
    return { failureType: 'quota_exceeded', reason: 'Gmail daily sending quota exceeded (550 5.4.5).' };
  }
  return { failureType: 'other', reason: anyErr?.message ?? (err instanceof Error ? err.message : 'Unknown send error') };
}

/**
 * Wraps nodemailer's sendMail so callers always get a typed result instead
 * of a thrown exception or a silently-ignored rejected-recipients list.
 * nodemailer resolves successfully even when SOME recipients were rejected
 * (info.rejected) — that's exactly the "bad email address" case this
 * whole feature exists to catch, so it has to be checked explicitly, not
 * inferred from the absence of a thrown error.
 */
async function sendMailSafely(mail: Parameters<ReturnType<typeof getTransporter>['sendMail']>[0]): Promise<SendResult> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mail);
    if (info.rejected && info.rejected.length > 0) {
      return { status: 'failed', reason: `Invalid recipient: ${info.rejected.join(', ')}`, failureType: 'invalid_address' };
    }
    return { status: 'sent' };
  } catch (err) {
    const { failureType, reason } = classifySmtpError(err);
    return { status: 'failed', reason, failureType };
  }
}

const BRAND = {
  orange: '#e8622c',
  navy: '#1f2937',
  sand: '#faf6f0',
};

/**
 * Email clients fetch <img src> from the open internet, not from this app's
 * dev/prod server — a relative path or a localhost NEXT_PUBLIC_SITE_URL
 * resolves to nothing from Gmail/Outlook's servers, hence the broken-image
 * icon. A base64 data: URI was tried first, but Gmail clips messages over
 * ~102KB and the clip landed mid-base64-string, corrupting the image (and
 * bloating every send). Using a hosted URL instead — a public "Anyone with
 * the link" Google Drive file for now, since the real site isn't deployed.
 *
 * TODO once deployed: switch to a URL on our own domain, or a proper image
 * CDN — Drive's `uc?export=view` hotlink format isn't intended for
 * production hotlinking and can be rate-limited/rotated by Google over
 * time. Fine as a stopgap only.
 */
const LOGO_URL = 'https://drive.google.com/uc?export=view&id=1YauXg9O6XtFyzK7glAW5C4xXEDZ4cJsV';

const NO_REPLY_HTML = `
  <table role="presentation" width="100%" style="margin: 24px 0; border-collapse: collapse;">
    <tr>
      <td style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 14px 16px;">
        <p style="margin: 0; color: #dc2626; font-weight: 700; font-size: 14px; line-height: 1.5;">
          ⚠ This is an automated email. Please do not reply to this email or send any emails to this address — they will not be read or answered.
        </p>
      </td>
    </tr>
  </table>
`;

const NO_REPLY_TEXT = `
****************************************************************
* THIS IS AN AUTOMATED EMAIL. DO NOT REPLY.
* Messages sent to this address will not be read or answered.
****************************************************************
`;

function wrapEmailHtml(bodyHtml: string, signOffHtml?: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; background: ${BRAND.sand}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" style="border-collapse: collapse; background: ${BRAND.sand}; padding: 32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; border-collapse: collapse;">
            <tr>
              <td style="background: linear-gradient(135deg, ${BRAND.orange}, #c94f1f); padding: 28px 32px; text-align: center;">
                <img src="${LOGO_URL}" alt="YWCA Camp" width="56" height="56" style="display: inline-block; object-fit: contain;" />
                <p style="margin: 8px 0 0; color: #ffffff; font-weight: 700; font-size: 18px; letter-spacing: 0.02em;">YWCA Camp</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                ${bodyHtml}
                ${NO_REPLY_HTML}
                ${signOffHtml ?? ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background: #f5f0e8; text-align: center;">
                <p style="margin: 0; color: #8a8478; font-size: 12px;">YWCA Camp &middot; Ras Sedr, South Sinai, Egypt</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type PendingPaymentEmailParams = {
  to: string;
  camperName: string;
  mobilePhone: string;
  registrationNumber: string;
  campName: string;
  campSlug: string;
  priceEgp: number;
  meetingPoints: string[];
};

const LOCATION_URL = 'https://ywcacampegypt.com/location';

/**
 * Final approved design (as of 2026-07-30) — a standalone self-contained
 * document, deliberately NOT sharing wrapEmailHtml/NO_REPLY_HTML/etc with
 * the waitlist templates below, since this layout (rounded card, teal/
 * orange palette, meeting-points panel) is its own approved design, not a
 * variant of the shared wrapper. Don't refactor this back into the shared
 * wrapper without the same explicit sign-off this template got.
 */
export async function sendPendingPaymentEmail(params: PendingPaymentEmailParams): Promise<SendResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const paymentUrl = `${siteUrl}/register/${params.campSlug}/payment?code=${encodeURIComponent(params.registrationNumber)}`;
  const priceLabel = params.priceEgp.toLocaleString();
  const meetingPointsHtml = params.meetingPoints.map((point) => `<li>${point}</li>`).join('');
  const meetingPointsText = params.meetingPoints.map((point) => `- ${point}`).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#eef2f0; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f0; padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">

<tr>
<td style="padding:28px 28px 0;">
<img src="${LOGO_URL}" alt="YWCA Camp" width="56" height="56" style="display:block; border-radius:10px;" />
</td>
</tr>

<tr>
<td style="padding:16px 28px 28px;">
<h1 style="margin:0; font-size:26px; color:#1a3c34; font-weight:800;">Registration Confirmed 🎉</h1>
<p style="margin:8px 0 0; font-size:15px; color:#5a6b64;">Get ready for an unforgettable week.</p>
</td>
</tr>

<tr>
<td style="padding:0 28px 24px;">
<p style="margin:0 0 16px; font-size:16px; color:#1a1a2e; line-height:1.6;">Hello <strong>${params.camperName}</strong>,</p>
<p style="margin:0; font-size:16px; color:#1a1a2e; line-height:1.6;">We are thrilled to confirm your registration for <strong>${params.campName}</strong>. Here's everything you need:</p>
</td>
</tr>

<tr>
<td style="padding:0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF4E8,#FFE8D6); background-color:#FFF4E8; border-radius:14px;">
<tr><td style="padding:22px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:6px 0; font-size:13px; color:#8a6a4a; width:40%;">Registration No.</td>
<td style="padding:6px 0; font-size:15px; color:#B34A17; font-weight:800; text-align:right;">${params.registrationNumber}</td>
</tr>
<tr>
<td style="padding:6px 0; font-size:13px; color:#8a6a4a;">Camp</td>
<td style="padding:6px 0; font-size:15px; color:#1a1a2e; font-weight:700; text-align:right;">${params.campName}</td>
</tr>
<tr>
<td style="padding:6px 0; font-size:13px; color:#8a6a4a;">Camper</td>
<td style="padding:6px 0; font-size:15px; color:#1a1a2e; font-weight:700; text-align:right;">${params.camperName}</td>
</tr>
<tr>
<td style="padding:6px 0; font-size:13px; color:#8a6a4a;">Mobile</td>
<td style="padding:6px 0; font-size:15px; color:#1a1a2e; font-weight:700; text-align:right;">${params.mobilePhone}</td>
</tr>
<tr>
<td style="padding:6px 0; font-size:13px; color:#8a6a4a;">Camp Fee</td>
<td style="padding:6px 0; font-size:15px; color:#1a6b5c; font-weight:800; text-align:right;">EGP ${priceLabel}</td>
</tr>
</table>
</td></tr>
</table>
</td>
</tr>

<tr>
<td style="padding:20px 28px 0;">
<p style="margin:0; font-size:15px; color:#1a1a2e; line-height:1.6;">📍 The camp will take place at <a href="${LOCATION_URL}" style="color:#1a6b5c; font-weight:700;">Paradise Beach, Ras Sudr</a>.</p>
</td>
</tr>

<tr>
<td align="center" style="padding:24px 28px;">
<a href="${paymentUrl}" style="display:inline-block; background-color:#1a6b5c; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:15px 40px; border-radius:100px;">Click to Pay →</a>
</td>
</tr>

<tr>
<td style="padding:4px 28px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F7F5; border-radius:12px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 8px; font-size:14px; color:#1a1a2e; font-weight:bold;">🚌 Meeting Points</p>
<ul style="margin:0 0 14px; padding-left:18px; font-size:14px; color:#5a5a5a; line-height:1.7;">
${meetingPointsHtml}
</ul>
<p style="margin:0; font-size:13px; color:#5a5a5a; line-height:1.6;">We will contact you a few days prior to the camp to confirm further details.</p>
</td></tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 28px 24px;">
<p style="margin:0; font-size:16px; color:#1a3c34; font-weight:700;">See you at Paradise Beach! 🏖️</p>
</td>
</tr>

<tr>
<td style="padding:0 28px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDECEC; border-radius:10px;">
<tr><td style="padding:14px 18px; font-size:13px; color:#B32424; font-weight:bold; line-height:1.5; text-align:center;">
⚠ This is an automated email. Please do not reply to this email or send any emails to this address — they will not be read or answered.
</td></tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 28px 32px; text-align:center;">
<p style="margin:0; font-size:13px; color:#8a8a8a;">Kind regards, <strong style="color:#1a3c34;">YWCA Camp Team</strong></p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Registration Confirmed

Hello ${params.camperName},

We are thrilled to confirm your registration for ${params.campName}. Here's everything you need:

Registration No.: ${params.registrationNumber}
Camp: ${params.campName}
Camper: ${params.camperName}
Mobile: ${params.mobilePhone}
Camp Fee: EGP ${priceLabel}

The camp will take place at Paradise Beach, Ras Sudr (${LOCATION_URL}).

Click to Pay: ${paymentUrl}

Meeting Points:
${meetingPointsText}

We will contact you a few days prior to the camp to confirm further details.

See you at Paradise Beach!
${NO_REPLY_TEXT}
Kind regards,
YWCA Camp Team`;

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: `Registration received — ${params.campName} (${params.registrationNumber})`,
    html,
    text,
  });
}

type WaitlistEmailParams = {
  to: string;
  camperName: string;
  registrationNumber: string;
  campName: string;
  waitlistPosition: number;
};

export async function sendWaitlistEmail(params: WaitlistEmailParams): Promise<SendResult> {
  const bodyHtml = `
    <p style="margin: 0 0 16px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">Hi,</p>
    <p style="margin: 0 0 16px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">
      <strong>${params.campName}</strong> is currently full. We've added <strong>${params.camperName}</strong> to the waitlist at position <strong>${params.waitlistPosition}</strong>.
    </p>
    <table role="presentation" width="100%" style="margin: 20px 0; border-collapse: collapse; background: #f5f0e8; border-radius: 10px;">
      <tr><td style="padding: 16px 20px;">
        <p style="margin: 0 0 6px; color: #8a8478; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Registration number</p>
        <p style="margin: 0; color: ${BRAND.orange}; font-size: 20px; font-weight: 700;">${params.registrationNumber}</p>
      </td></tr>
    </table>
    <p style="margin: 0; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">We'll email you if a spot opens up — no payment is needed right now.</p>
  `;

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: `You're on the waitlist — ${params.campName} (${params.registrationNumber})`,
    html: wrapEmailHtml(bodyHtml),
    text: `Hi,

${params.campName} is currently full. We've added ${params.camperName} to the waitlist at position ${params.waitlistPosition}.

Registration number: ${params.registrationNumber}

We'll email you if a spot opens up — no payment is needed right now.
${NO_REPLY_TEXT}`,
  });
}

type WaitlistPromotedEmailParams = {
  to: string;
  camperName: string;
  registrationNumber: string;
  campName: string;
  campSlug: string;
  priceEgp: number;
};

/** Sent when Admin/Super Admin promotes a waitlisted registration (Track B) — a spot opened up. */
export async function sendWaitlistPromotedEmail(params: WaitlistPromotedEmailParams): Promise<SendResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const paymentUrl = `${siteUrl}/register/${params.campSlug}/payment?code=${encodeURIComponent(params.registrationNumber)}`;

  const bodyHtml = `
    <p style="margin: 0 0 16px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">Hi,</p>
    <p style="margin: 0 0 16px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">
      Good news — a spot opened up in <strong>${params.campName}</strong> and <strong>${params.camperName}</strong> is off the waitlist!
    </p>
    <table role="presentation" width="100%" style="margin: 20px 0; border-collapse: collapse; background: #f5f0e8; border-radius: 10px;">
      <tr><td style="padding: 16px 20px;">
        <p style="margin: 0 0 6px; color: #8a8478; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Registration number</p>
        <p style="margin: 0 0 14px; color: ${BRAND.orange}; font-size: 20px; font-weight: 700;">${params.registrationNumber}</p>
        <p style="margin: 0 0 6px; color: #8a8478; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Total due</p>
        <p style="margin: 0; color: ${BRAND.navy}; font-size: 18px; font-weight: 700;">EGP ${params.priceEgp.toLocaleString()}</p>
      </td></tr>
    </table>
    <p style="margin: 0 0 20px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">Complete payment soon to secure the spot:</p>
    <table role="presentation" style="margin: 0 0 16px; border-collapse: collapse;">
      <tr><td style="background: ${BRAND.orange}; border-radius: 999px;">
        <a href="${paymentUrl}" style="display: inline-block; padding: 12px 28px; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none;">Complete payment &amp; upload documents</a>
      </td></tr>
    </table>
  `;

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: `A spot opened up — ${params.campName} (${params.registrationNumber})`,
    html: wrapEmailHtml(bodyHtml),
    text: `Hi,

Good news — a spot opened up in ${params.campName} and ${params.camperName} is off the waitlist!

Registration number: ${params.registrationNumber}
Total due: EGP ${params.priceEgp.toLocaleString()}

Complete payment soon to secure the spot:
${paymentUrl}
${NO_REPLY_TEXT}`,
  });
}

type PasswordResetEmailParams = {
  to: string;
  resetUrl: string;
};

/**
 * Only for username-based staff accounts — their Supabase Auth email is a
 * synthetic `.invalid` address that can never receive mail, so Supabase's
 * built-in password-reset email is useless here. This goes to the real
 * `recovery_email` on file instead, via the app's own Gmail transporter.
 */
export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<SendResult> {
  const bodyHtml = `
    <p style="margin: 0 0 16px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">Hi,</p>
    <p style="margin: 0 0 16px; color: ${BRAND.navy}; font-size: 15px; line-height: 1.6;">
      A password reset was requested for your YWCA Camp staff portal account. Click below to set a new password — this link expires in 1 hour and can only be used once.
    </p>
    <table role="presentation" width="100%" style="margin: 20px 0; border-collapse: collapse;">
      <tr><td style="padding: 0;">
        <a href="${params.resetUrl}" style="display: inline-block; padding: 12px 24px; background: ${BRAND.orange}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">Reset password</a>
      </td></tr>
    </table>
    <p style="margin: 0; color: #8a8478; font-size: 13px; line-height: 1.6;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `;

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: 'Reset your YWCA Camp staff portal password',
    html: wrapEmailHtml(bodyHtml),
    text: `Hi,

A password reset was requested for your YWCA Camp staff portal account. Use the link below to set a new password — it expires in 1 hour and can only be used once.

${params.resetUrl}

If you didn't request this, you can safely ignore this email — your password won't change.
${NO_REPLY_TEXT}`,
  });
}
