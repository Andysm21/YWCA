import 'server-only';
import nodemailer from 'nodemailer';
import { getSiteUrl, getEmailAssetBase } from '@/lib/site-url';

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
    const info = await transporter.sendMail({
      ...mail,
      // Marks the message as automated transactional mail (keeps auto-responders from replying to it).
      headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'OOF, AutoReply', ...(mail.headers as Record<string, string> | undefined) },
    });
    if (info.rejected && info.rejected.length > 0) {
      return { status: 'failed', reason: `Invalid recipient: ${info.rejected.join(', ')}`, failureType: 'invalid_address' };
    }
    return { status: 'sent' };
  } catch (err) {
    const { failureType, reason } = classifySmtpError(err);
    return { status: 'failed', reason, failureType };
  }
}

/** Guest-supplied values (camper name, etc.) are interpolated into HTML emails sent from the org's own Gmail account — escape them or a crafted name becomes a phishing link in a trusted sender's email. */
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BRAND = {
  orange: '#e8622c',
  navy: '#1f2937',
  sand: '#faf6f0',
};

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
                <span style="display: inline-block; background: #ffffff; border-radius: 16px; padding: 8px 12px;"><img src="${getEmailAssetBase()}/ywca-logo.png" alt="YWCA" width="44" style="display: inline-block; vertical-align: middle; height: auto; border: 0;" /><img src="${getEmailAssetBase()}/logo.png" alt="The Camp" width="64" style="display: inline-block; vertical-align: middle; height: auto; border: 0; margin-left: 8px;" /></span>
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
                <p style="margin: 0; color: #8a8478; font-size: 12px;">YWCA Camp &middot; Paradise, Ras Sudr, Egypt</p>
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
  busPickup?: string;
};

const LOCATION_URL = 'https://ywcacampegypt.com/location';

const EMAIL_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** YWCA triangle + camp logo on a white chip (transparent PNGs hosted on our public site; mail clients can only load public https images). */
function heroLogoHtml(): string {
  const base = getEmailAssetBase();
  return `<span style="display:inline-block; background-color:#ffffff; border-radius:18px; padding:12px 18px;"><img src="${base}/ywca-logo.png" alt="YWCA" width="54" style="display:inline-block; vertical-align:middle; height:auto; border:0;" /><img src="${base}/logo.png" alt="The Camp" width="82" style="display:inline-block; vertical-align:middle; height:auto; border:0; margin-left:10px;" /></span>`;
}

type EmailShellOptions = {
  preheader: string;
  pill: string;
  pillColor?: string;
  title: string;
  subtitle: string;
  contentHtml: string;
};

/** Shared "cool" layout for the action-needed emails: navy hero with a sunset stripe, content card, footer. */
function emailShell(opts: EmailShellOptions): string {
  const pillColor = opts.pillColor ?? '#F5B83D';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#F3EEE6; font-family:${EMAIL_FONT};">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#F3EEE6;">${escapeHtml(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3EEE6; padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 6px 28px rgba(27,31,58,0.12);">

<tr>
<td align="center" bgcolor="#1B1F3A" style="background-color:#1B1F3A; background-image:linear-gradient(135deg,#1B1F3A 0%,#2A2F57 100%); padding:34px 28px 30px;">
${heroLogoHtml()}
<p style="margin:18px 0 0;"><span style="display:inline-block; background-color:${pillColor}; color:#1B1F3A; font-size:11px; font-weight:800; letter-spacing:0.06em; padding:6px 14px; border-radius:100px;">${escapeHtml(opts.pill)}</span></p>
<h1 style="margin:14px 0 6px; font-size:30px; line-height:1.15; color:#ffffff; font-weight:800;">${opts.title}</h1>
<p style="margin:0; font-size:15px; line-height:1.5; color:#C9CBE0;">${opts.subtitle}</p>
</td>
</tr>
<tr>
<td height="6" bgcolor="#E8531E" style="height:6px; line-height:6px; font-size:0; background-color:#E8531E; background-image:linear-gradient(90deg,#E8531E 0%,#F5B83D 100%);">&nbsp;</td>
</tr>

<tr>
<td style="padding:30px 28px 8px;">
${opts.contentHtml}
</td>
</tr>

<tr>
<td style="padding:0 28px 14px;">
<p style="margin:0; font-size:12px; line-height:1.6; color:#6B6E80;">If this email reached your spam or junk folder, please mark it as <strong>Not spam</strong> so you receive our next messages in your inbox.</p>
</td>
</tr>

<tr>
<td style="padding:8px 28px 26px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDECEC; border-radius:12px;">
<tr><td style="padding:13px 16px; font-size:12px; color:#B32424; font-weight:bold; line-height:1.5; text-align:center;">
⚠ This is an automated email. Please do not reply to this email or send any emails to this address — they will not be read or answered.
</td></tr>
</table>
</td>
</tr>

<tr>
<td align="center" bgcolor="#F8F4EC" style="background-color:#F8F4EC; padding:22px 28px;">
<p style="margin:0 0 4px; font-size:13px; color:#6B6E80;">Kind regards, <strong style="color:#1B1F3A;">YWCA Camp Team</strong></p>
<p style="margin:0; font-size:12px; color:#9A9CAD;">Paradise, Ras Sudr, Egypt</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

type StepState = 'done' | 'now' | 'next';

function stepRowHtml(n: number, title: string, body: string, state: StepState): string {
  const circle =
    state === 'done'
      ? `<td width="38" valign="top"><div style="width:30px; height:30px; line-height:30px; border-radius:15px; background-color:#1A9B6C; color:#ffffff; text-align:center; font-weight:800; font-size:15px;">✓</div></td>`
      : state === 'now'
        ? `<td width="38" valign="top"><div style="width:30px; height:30px; line-height:30px; border-radius:15px; background-color:#E8531E; color:#ffffff; text-align:center; font-weight:800; font-size:14px;">${n}</div></td>`
        : `<td width="38" valign="top"><div style="width:26px; height:26px; line-height:26px; border-radius:15px; border:2px solid #D8D4CB; color:#8A8D9F; text-align:center; font-weight:800; font-size:13px;">${n}</div></td>`;
  const titleColor = state === 'next' ? '#6B6E80' : '#1B1F3A';
  const tag = state === 'done' ? ' <span style="color:#1A9B6C; font-size:12px; font-weight:700;">DONE</span>' : state === 'now' ? ' <span style="color:#E8531E; font-size:12px; font-weight:700;">← YOU ARE HERE</span>' : '';
  return `<tr>${circle}<td style="padding:0 0 18px;"><p style="margin:0; font-size:15px; font-weight:800; color:${titleColor};">${escapeHtml(title)}${tag}</p><p style="margin:3px 0 0; font-size:13px; line-height:1.55; color:#6B6E80;">${body}</p></td></tr>`;
}

function detailRowHtml(label: string, value: string, valueColor = '#1B1F3A'): string {
  return `<tr><td style="padding:7px 0; font-size:13px; color:#8A6A4A; width:42%;">${label}</td><td style="padding:7px 0; font-size:15px; color:${valueColor}; font-weight:800; text-align:right;">${value}</td></tr>`;
}

function ctaButtonHtml(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr><td align="center" bgcolor="#E8531E" style="background-color:#E8531E; background-image:linear-gradient(135deg,#F06A2A,#D9481A); border-radius:100px; box-shadow:0 6px 16px rgba(232,83,30,0.35);"><a href="${escapeHtml(url)}" style="display:inline-block; padding:17px 44px; color:#ffffff; font-size:17px; font-weight:800; text-decoration:none; letter-spacing:0.01em;">${label}</a></td></tr></table>`;
}

/**
 * Sent right after the registration form is submitted. IMPORTANT wording:
 * at this point the camper is only PENDING PAYMENT — they are NOT
 * registered and NO spot is reserved until they pay in full AND upload the
 * proof of payment, so this email must never say "confirmed"/"successful".
 */
export async function sendPendingPaymentEmail(params: PendingPaymentEmailParams): Promise<SendResult> {
  const siteUrl = getSiteUrl();
  const paymentUrl = `${siteUrl}/register/${params.campSlug}/payment?code=${encodeURIComponent(params.registrationNumber)}`;
  const priceLabel = params.priceEgp.toLocaleString();
  const firstName = params.camperName.trim().split(/\s+/)[0] || 'there';
  const meetingPointsHtml = params.meetingPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
  const meetingPointsText = params.meetingPoints.map((point) => `- ${point}`).join('\n');

  const contentHtml = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF6DD; border:2px solid #F5B83D; border-radius:14px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0 0 4px; font-size:12px; font-weight:800; letter-spacing:0.1em; color:#9A6A00;">Status: pending payment</p>
<p style="margin:0; font-size:15px; line-height:1.55; color:#3D2F00;"><strong>Your spot is not secured yet.</strong> You are only registered once you pay the full amount <em>and</em> upload your proof of payment.</p>
</td></tr>
</table>

<p style="margin:22px 0 6px; font-size:16px; line-height:1.6; color:#1B1F3A;">Hi <strong>${escapeHtml(params.camperName)}</strong>,</p>
<p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#4A4D63;">Thanks for filling in the registration form for <strong>${escapeHtml(params.campName)}</strong> — that was step one! Here is how to lock in your place:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${stepRowHtml(1, 'Registration form', 'We have your details.', 'done')}
${stepRowHtml(2, `Pay the full amount — EGP ${priceLabel}`, 'Use the button below to open your personal payment page.', 'now')}
${stepRowHtml(3, 'Upload your proof of payment', 'Add a screenshot of the payment on the same page.', 'next')}
${stepRowHtml(4, 'We confirm your spot', 'Our team checks your payment, then emails you a final confirmation.', 'next')}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 24px;"><tr><td>${ctaButtonHtml(paymentUrl, 'Pay &amp; Secure My Spot →')}</td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF4E8; border-radius:14px;">
<tr><td style="padding:18px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${detailRowHtml('Registration No.', escapeHtml(params.registrationNumber), '#B34A17')}
${detailRowHtml('Camp', escapeHtml(params.campName))}
${detailRowHtml('Camper', escapeHtml(params.camperName))}
${detailRowHtml('Mobile', escapeHtml(params.mobilePhone))}
${params.busPickup ? detailRowHtml('Bus pickup', escapeHtml(params.busPickup)) : ''}
${detailRowHtml('Amount due', `EGP ${priceLabel}`, '#1A6B5C')}
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px; background-color:#FDECEC; border-radius:12px;">
<tr><td style="padding:14px 18px; font-size:13px; line-height:1.55; color:#8F1D1D;">
<strong>Please note:</strong> if the payment and proof of payment are not completed in this order, your registration stays <strong>pending</strong>, you will <strong>not</strong> be registered, and a place is <strong>not guaranteed</strong>.
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px; background-color:#F5F5F2; border-radius:12px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 6px; font-size:14px; font-weight:800; color:#1B1F3A;">📍 Where &amp; when to meet (once your spot is confirmed)</p>
<p style="margin:0 0 10px; font-size:13px; color:#5A5D70; line-height:1.6;">The camp takes place at <a href="${LOCATION_URL}" style="color:#1A6B5C; font-weight:700;">Paradise Beach, Ras Sudr</a>.</p>
<ul style="margin:0 0 12px; padding-left:18px; font-size:13px; color:#5A5D70; line-height:1.7;">
${meetingPointsHtml}
</ul>
<p style="margin:0; font-size:12px; color:#7A7D90; line-height:1.6;">We will contact confirmed campers a few days before camp with further details.</p>
</td></tr>
</table>
`;

  const html = emailShell({
    preheader: `Your spot at ${params.campName} is not secured yet — pay in full and upload your proof of payment.`,
    pill: 'Next step',
    title: `Almost there, ${escapeHtml(firstName)}!`,
    subtitle: `Your spot at ${escapeHtml(params.campName)} isn't secured yet.`,
    contentHtml,
  });

  const text = `YOUR SPOT IS NOT SECURED YET - PAYMENT IS THE NEXT STEP

Hi ${params.camperName},

Thanks for filling in the registration form for ${params.campName}. Your registration is PENDING PAYMENT: you are only registered, and your spot is only secured, once you pay the full amount AND upload your proof of payment.

How to secure your spot:
1. Registration form - DONE
2. Pay the full amount (EGP ${priceLabel}) using your personal payment page
3. Upload a screenshot of your payment on the same page
4. We check your payment and email you a final confirmation

Pay & secure my spot: ${paymentUrl}

Registration No.: ${params.registrationNumber}
Camp: ${params.campName}
Camper: ${params.camperName}
Mobile: ${params.mobilePhone}${params.busPickup ? `
Bus pickup: ${params.busPickup}` : ''}
Amount due: EGP ${priceLabel}

Please note: if the payment and proof of payment are not completed in this order, your registration stays pending, you will not be registered, and a place is not guaranteed.

Where & when to meet (once your spot is confirmed)
Paradise Beach, Ras Sudr (${LOCATION_URL})
${meetingPointsText}
We will contact confirmed campers a few days before camp with further details.
${NO_REPLY_TEXT}
Kind regards,
YWCA Camp Team`;

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: `Your YWCA Camp payment link for ${params.campName} (${params.registrationNumber})`,
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
      <strong>${escapeHtml(params.campName)}</strong> is currently full. We've added <strong>${escapeHtml(params.camperName)}</strong> to the waitlist at position <strong>${params.waitlistPosition}</strong>.
    </p>
    <table role="presentation" width="100%" style="margin: 20px 0; border-collapse: collapse; background: #f5f0e8; border-radius: 10px;">
      <tr><td style="padding: 16px 20px;">
        <p style="margin: 0 0 6px; color: #8a8478; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Registration number</p>
        <p style="margin: 0; color: ${BRAND.orange}; font-size: 20px; font-weight: 700;">${escapeHtml(params.registrationNumber)}</p>
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
  const siteUrl = getSiteUrl();
  const paymentUrl = `${siteUrl}/register/${params.campSlug}/payment?code=${encodeURIComponent(params.registrationNumber)}`;
  const priceLabel = params.priceEgp.toLocaleString();
  const firstName = params.camperName.trim().split(/\s+/)[0] || 'there';

  const contentHtml = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF6DD; border:2px solid #F5B83D; border-radius:14px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0 0 4px; font-size:12px; font-weight:800; letter-spacing:0.1em; color:#9A6A00;">Status: pending payment</p>
<p style="margin:0; font-size:15px; line-height:1.55; color:#3D2F00;"><strong>A spot is open for you, but it is not secured yet.</strong> It is yours once you pay the full amount <em>and</em> upload your proof of payment.</p>
</td></tr>
</table>

<p style="margin:22px 0 22px; font-size:15px; line-height:1.6; color:#4A4D63;">Hi <strong>${escapeHtml(params.camperName)}</strong>, a place opened up in <strong>${escapeHtml(params.campName)}</strong> and you are off the waitlist. To claim it:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${stepRowHtml(1, `Pay the full amount — EGP ${priceLabel}`, 'Use the button below to open your personal payment page.', 'now')}
${stepRowHtml(2, 'Upload your proof of payment', 'Add a screenshot of the payment on the same page.', 'next')}
${stepRowHtml(3, 'We confirm your spot', 'Our team checks your payment, then emails you a final confirmation.', 'next')}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 24px;"><tr><td>${ctaButtonHtml(paymentUrl, 'Pay &amp; Claim My Spot →')}</td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF4E8; border-radius:14px;">
<tr><td style="padding:18px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${detailRowHtml('Registration No.', escapeHtml(params.registrationNumber), '#B34A17')}
${detailRowHtml('Camp', escapeHtml(params.campName))}
${detailRowHtml('Camper', escapeHtml(params.camperName))}
${detailRowHtml('Amount due', `EGP ${priceLabel}`, '#1A6B5C')}
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px; background-color:#FDECEC; border-radius:12px;">
<tr><td style="padding:14px 18px; font-size:13px; line-height:1.55; color:#8F1D1D;">
<strong>Please note:</strong> until payment and proof of payment are completed, the spot is <strong>not guaranteed</strong> and may be offered to the next camper on the waitlist.
</td></tr>
</table>
`;

  const html = emailShell({
    preheader: `A spot opened up in ${params.campName} — pay in full and upload your proof of payment to claim it.`,
    pill: 'Good news',
    pillColor: '#6EE7B7',
    title: `A spot opened up, ${escapeHtml(firstName)}!`,
    subtitle: `You're off the waitlist for ${escapeHtml(params.campName)}.`,
    contentHtml,
  });

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: `A spot opened up in ${params.campName} (${params.registrationNumber})`,
    html,
    text: `GOOD NEWS - A SPOT OPENED UP (NOT SECURED YET)

Hi ${params.camperName},

A place opened up in ${params.campName} and you are off the waitlist. The spot is yours only once you pay the full amount AND upload your proof of payment.

1. Pay the full amount (EGP ${priceLabel}) using your personal payment page
2. Upload a screenshot of your payment on the same page
3. We check your payment and email you a final confirmation

Pay & claim my spot: ${paymentUrl}

Registration No.: ${params.registrationNumber}
Camp: ${params.campName}
Camper: ${params.camperName}
Amount due: EGP ${priceLabel}

Please note: until payment and proof of payment are completed, the spot is not guaranteed and may be offered to the next camper on the waitlist.
${NO_REPLY_TEXT}`,
  });
}

type SpotConfirmedEmailParams = {
  to: string;
  camperName: string;
  registrationNumber: string;
  campName: string;
  dateRange: string;
  priceEgp: number;
  meetingPoints: string[];
  busPickup?: string | null;
};

/**
 * Final email, sent when staff confirm the payment. This is the ONLY email
 * that may say the camper is registered, paid and has a secured spot.
 */
export async function sendSpotConfirmedEmail(params: SpotConfirmedEmailParams): Promise<SendResult> {
  const priceLabel = params.priceEgp.toLocaleString();
  const firstName = params.camperName.trim().split(/\s+/)[0] || 'there';
  const meetingPointsHtml = params.meetingPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
  const meetingPointsText = params.meetingPoints.map((point) => `- ${point}`).join('\n');

  const contentHtml = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E7F8EF; border:2px solid #1A9B6C; border-radius:14px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0 0 4px; font-size:12px; font-weight:800; letter-spacing:0.1em; color:#0F6B49;">Status: registered &amp; paid ✓</p>
<p style="margin:0; font-size:15px; line-height:1.55; color:#0B3D2B;"><strong>You are successfully registered and your payment is confirmed.</strong> Your spot at ${escapeHtml(params.campName)} is secured!</p>
</td></tr>
</table>

<p style="margin:22px 0 6px; font-size:16px; line-height:1.6; color:#1B1F3A;">Hi <strong>${escapeHtml(params.camperName)}</strong>,</p>
<p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#4A4D63;">We have reviewed your documents and payment — everything is in order. We can&rsquo;t wait to see you at camp! 🏕️</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${stepRowHtml(1, 'Registration form', 'We have your details.', 'done')}
${stepRowHtml(2, `Payment — EGP ${priceLabel}`, 'Received and verified by our team.', 'done')}
${stepRowHtml(3, 'Spot secured', 'You are officially part of the camp. See you there!', 'done')}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF4E8; border-radius:14px; margin-top:6px;">
<tr><td style="padding:18px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${detailRowHtml('Registration No.', escapeHtml(params.registrationNumber), '#B34A17')}
${detailRowHtml('Camp', escapeHtml(params.campName))}
${detailRowHtml('Dates', escapeHtml(params.dateRange))}
${detailRowHtml('Camper', escapeHtml(params.camperName))}
${params.busPickup ? detailRowHtml('Bus pickup', escapeHtml(params.busPickup)) : ''}
${detailRowHtml('Paid', `EGP ${priceLabel}`, '#1A6B5C')}
</table>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px; background-color:#F5F5F2; border-radius:12px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 6px; font-size:14px; font-weight:800; color:#1B1F3A;">📍 Where &amp; when to meet</p>
<p style="margin:0 0 10px; font-size:13px; color:#5A5D70; line-height:1.6;">The camp takes place at <a href="${LOCATION_URL}" style="color:#1A6B5C; font-weight:700;">Paradise Beach, Ras Sudr</a>.</p>
<ul style="margin:0 0 12px; padding-left:18px; font-size:13px; color:#5A5D70; line-height:1.7;">
${meetingPointsHtml}
</ul>
<p style="margin:0; font-size:12px; color:#7A7D90; line-height:1.6;">We will contact you a few days before camp with the final details.</p>
</td></tr>
</table>
`;

  const html = emailShell({
    preheader: `You're in! Your spot at ${params.campName} is secured — we can't wait to see you at camp.`,
    pill: 'Spot secured',
    pillColor: '#6EE7B7',
    title: `You&rsquo;re in, ${escapeHtml(firstName)}! 🎉`,
    subtitle: `Registered, paid and secured for ${escapeHtml(params.campName)}.`,
    contentHtml,
  });

  const text = `YOU'RE IN! YOUR SPOT IS SECURED

Hi ${params.camperName},

You are successfully registered and your payment is confirmed. Your spot at ${params.campName} is secured. We have reviewed your documents and payment - everything is in order. We can't wait to see you at camp!

Registration No.: ${params.registrationNumber}
Camp: ${params.campName}
Dates: ${params.dateRange}
Camper: ${params.camperName}${params.busPickup ? `
Bus pickup: ${params.busPickup}` : ''}
Paid: EGP ${priceLabel}

Where & when to meet
Paradise Beach, Ras Sudr (${LOCATION_URL})
${meetingPointsText}
We will contact you a few days before camp with the final details.
${NO_REPLY_TEXT}
Kind regards,
YWCA Camp Team`;

  return sendMailSafely({
    from: `"YWCA Camp" <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: `You're in! Your spot at ${params.campName} is secured (${params.registrationNumber})`,
    html,
    text,
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
        <a href="${escapeHtml(params.resetUrl)}" style="display: inline-block; padding: 12px 24px; background: ${BRAND.orange}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">Reset password</a>
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
