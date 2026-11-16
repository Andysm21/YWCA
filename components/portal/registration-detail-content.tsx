'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Loader2, Check, Download, ExternalLink, FileText, FileImage, AlertTriangle, Mail, Phone, User, Users, HeartPulse, ClipboardList, FolderOpen } from 'lucide-react';
import { StatusBadge } from '@/components/portal/status-badge';
import { RegistrationActionsCell } from '@/components/portal/registration-actions-cell';
import { EmailStatusCell } from '@/components/portal/email-status-cell';
import { ConfirmDialog, type ConfirmState } from '@/components/portal/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatDateRange } from '@/lib/camp-data';
import type { RegistrationDocument, RegistrationRow } from '@/lib/queries/registrations';

type Camp = { id: string; slug: string; name: string; price: number; dateStart: string; dateEnd: string; season: string } | null;

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function ageOn(dob: string | null | undefined, on: string | undefined) {
  if (!dob) return null;
  const b = new Date(dob);
  const ref = on ? new Date(on) : new Date();
  let a = ref.getUTCFullYear() - b.getUTCFullYear();
  if (ref.getUTCMonth() < b.getUTCMonth() || (ref.getUTCMonth() === b.getUTCMonth() && ref.getUTCDate() < b.getUTCDate())) a -= 1;
  return a;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        {title}
      </h2>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Field({ label, value, href, wide }: { label: string; value?: React.ReactNode; href?: string; wide?: boolean }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-foreground">
        {empty ? <span className="text-muted-foreground">—</span> : href ? <a href={href} className="text-primary hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

function DocumentCard({ registrationId, doc }: { registrationId: string; doc: RegistrationDocument }) {
  const [failed, setFailed] = React.useState(false);
  const ext = (doc.file_name.split('.').pop() ?? '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const src = `/api/portal/registrations/${registrationId}/documents/${doc.id}`;
  const label = doc.type === 'certificate' ? 'Birth certificate' : 'Payment proof';

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/40">
      <a href={src} target="_blank" rel="noreferrer" className="block bg-muted/30">
        {isImage && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} loading="lazy" onError={() => setFailed(true)} className="h-56 w-full object-contain sm:h-64" />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            {isImage ? <FileImage className="h-10 w-10" /> : <FileText className="h-10 w-10" />}
            <span className="text-xs">{failed ? 'Preview unavailable' : ext.toUpperCase() || 'File'}</span>
          </div>
        )}
      </a>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {(doc.file_size_bytes / 1024).toFixed(0)} KB · uploaded {fmtDateTime(doc.uploaded_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-full">
            <a href={src} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View</a>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full border-border/60 bg-transparent">
            <a href={`${src}?download=1`}><Download className="mr-1.5 h-3.5 w-3.5" /> Download</a>
          </Button>
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <a href={doc.drive_file_url} target="_blank" rel="noreferrer">Open in Drive</a>
          </Button>
        </div>
        {failed && (
          <p className="flex items-start gap-1.5 text-xs text-amber-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Couldn&apos;t load the preview here. If &quot;View&quot; also fails, Google Drive may need reconnecting. &quot;Open in Drive&quot; still works for people with access.
          </p>
        )}
      </div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Fix a wrong email: edit guardian/camper email, optionally re-send the right email to the new address. */
function EditEmailsCard({ r, onConfirm }: { r: Record<string, any>; onConfirm: (s: NonNullable<ConfirmState>) => void }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [parentEmail, setParentEmail] = React.useState<string>(r.parent_email ?? '');
  const [camperEmail, setCamperEmail] = React.useState<string>(r.email ?? '');
  const [busy, setBusy] = React.useState<'save' | 'resend' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const resendable = ['pending_payment', 'waitlisted', 'confirmed'].includes(r.status);
  const changed = parentEmail.trim().toLowerCase() !== (r.parent_email ?? '') || camperEmail.trim().toLowerCase() !== (r.email ?? '');

  async function save(resend: boolean) {
    setError(null);
    setNote(null);
    if (!EMAIL_RE.test(parentEmail.trim()) || !EMAIL_RE.test(camperEmail.trim())) {
      setError('Enter valid email addresses.');
      return;
    }
    setBusy(resend ? 'resend' : 'save');
    try {
      const res = await fetch(`/api/portal/registrations/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_email: parentEmail, email: camperEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      let message = 'Email updated.';
      if (resend) {
        const rr = await fetch(`/api/portal/registrations/${r.id}/resend-email`, { method: 'POST' });
        const rd = await rr.json().catch(() => ({}));
        message = rr.ok ? 'Email updated and the email was re-sent to the new address.' : `Email updated, but re-sending failed: ${rd.error ?? 'unknown error'}`;
      }
      setNote(message);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-4 w-4" /></span>
          Fix a wrong email
        </h2>
        {!open && (
          <Button size="sm" variant="outline" className="rounded-full border-border/60 bg-transparent" onClick={() => setOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit emails
          </Button>
        )}
      </div>
      {note && <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-500"><Check className="h-4 w-4" /> {note}</p>}
      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Guardian email <span className="text-xs text-muted-foreground">(payment &amp; confirmation emails go here)</span></Label>
              <Input id="parentEmail" type="email" inputMode="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="rounded-xl bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camperEmail">Camper email</Label>
              <Input id="camperEmail" type="email" inputMode="email" value={camperEmail} onChange={(e) => setCamperEmail(e.target.value)} className="rounded-xl bg-background/50" />
            </div>
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {resendable && (
              <Button size="sm" className="rounded-full glow-orange" disabled={!!busy || !changed} onClick={() => save(true)}>
                {busy === 'resend' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />} Save &amp; re-send email
              </Button>
            )}
            <Button size="sm" variant="outline" className="rounded-full border-border/60 bg-transparent" disabled={!!busy || !changed} onClick={() => save(false)}>
              {busy === 'save' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Save only
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" disabled={!!busy} onClick={() => { setOpen(false); setError(null); setParentEmail(r.parent_email ?? ''); setCamperEmail(r.email ?? ''); }}>Cancel</Button>
          </div>
          {resendable && <p className="text-xs text-muted-foreground">&quot;Save &amp; re-send&quot; sends the right email for this registration ({r.status === 'confirmed' ? 'the spot-secured confirmation' : r.status === 'waitlisted' ? 'the waitlist email' : 'the payment link'}) to the new address.</p>}
        </div>
      )}
    </section>
  );
}

/** Super Admin: permanently remove a wrong or duplicate registration. */
function DeleteRegistrationCard({ r, campId, onConfirm }: { r: Record<string, any>; campId: string | null; onConfirm: (s: NonNullable<ConfirmState>) => void }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/registrations/${r.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not remove the registration');
      router.replace(campId ? `/portal/admin/camps/${campId}` : '/portal/super-admin?tab=registrations');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the registration');
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500"><Trash2 className="h-4 w-4" /></span>
        Remove this registration
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">For a wrong or duplicate registration. It is deleted permanently{r.status === 'confirmed' ? ' and its confirmed spot is freed' : ''}. Uploaded files stay in Google Drive.</p>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      <Button
        size="sm"
        variant="outline"
        className="mt-3 rounded-full border-rose-500/40 bg-transparent text-rose-500 hover:text-rose-500"
        disabled={busy}
        onClick={() => onConfirm({
          title: `Permanently remove ${r.camper_name}'s registration?`,
          description: `${r.registration_number} will be deleted for good, together with its document records. ${r.status === 'confirmed' ? 'It is CONFIRMED and paid: only remove it if the payment is being handled separately. ' : ''}This cannot be undone.`,
          onConfirm: () => { remove(); },
        })}
      >
        {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />} Remove registration
      </Button>
    </section>
  );
}

export function RegistrationDetailContent({
  registration: r, camp, documents, isSuperAdmin = false,
}: {
  registration: Record<string, any>;
  camp: Camp;
  documents: RegistrationDocument[];
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);
  const cert = documents.filter((d) => d.type === 'certificate');
  const pay = documents.filter((d) => d.type === 'payment_screenshot');
  const age = ageOn(r.date_of_birth, camp?.dateStart);

  const asRow = {
    ...r,
    camps: camp ? { name: camp.name, price_egp: camp.price, slug: camp.slug } : null,
  } as unknown as RegistrationRow;

  return (
    <div>
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">{r.camper_name}</h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{r.registration_number}</span>
            {camp && <> · <Link href={`/portal/admin/camps/${camp.id}`} className="font-medium text-primary hover:underline">{camp.name} {camp.season}</Link> · {formatDateRange(camp.dateStart, camp.dateEnd)}</>}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-border/60 bg-card/50 p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
          <RegistrationActionsCell registration={asRow} onConfirm={setConfirmState} />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <Section icon={FolderOpen} title="Documents">
          <div className="sm:col-span-2">
            {documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                {r.status === 'pending_payment' ? 'No documents yet — the guardian has not uploaded the birth certificate and payment proof.' : 'No documents on file for this registration.'}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[...cert, ...pay].map((d) => <DocumentCard key={d.id} registrationId={r.id} doc={d} />)}
              </div>
            )}
          </div>
        </Section>

        <Section icon={User} title="Camper">
          <Field label="Full name" value={r.camper_name} />
          <Field label="Birth date" value={r.date_of_birth ? `${formatDate(r.date_of_birth)}${age !== null ? ` (age ${age} at camp start)` : ''}` : null} />
          <Field label="Grade / academic year" value={r.academic_year} />
          <Field label="School" value={r.school} />
          <Field label="T-shirt size" value={r.tshirt_size} />
          <Field label="Bus pickup" value={r.bus_pickup} />
          <Field label="First-time camper" value={r.first_time_camper ? 'Yes' : 'No'} />
          <Field label="Mobile" value={r.mobile_phone} href={`tel:${r.mobile_phone}`} />
          <Field label="Email" value={r.email} href={`mailto:${r.email}`} />
        </Section>

        <Section icon={Users} title="Guardian">
          <Field label="Name" value={r.parent_name} />
          <Field label="Mobile" value={r.parent_mobile} href={`tel:${r.parent_mobile}`} />
          <Field label="Alternate mobile" value={r.alternate_mobile} href={r.alternate_mobile ? `tel:${r.alternate_mobile}` : undefined} />
          <Field label="Email" value={r.parent_email} href={`mailto:${r.parent_email}`} />
        </Section>

        <Section icon={HeartPulse} title="Emergency & medical">
          <Field label="Emergency contact" value={r.emergency_contact_name} />
          <Field label="Emergency number" value={r.emergency_contact_number} href={`tel:${r.emergency_contact_number}`} />
          <Field label="Medical conditions" value={r.medical_condition} wide />
          <Field label="Additional info" value={r.additional_info} wide />
        </Section>

        <Section icon={ClipboardList} title="Registration">
          <Field label="Registered" value={fmtDateTime(r.created_at)} />
          <Field label="Status" value={<StatusBadge status={r.status} />} />
          <Field label="Camp price" value={camp ? `EGP ${camp.price.toLocaleString()}` : null} />
          <Field label="Waitlist position" value={r.waitlist_position} />
          <Field label="Promoted from waitlist" value={r.promoted_from_waitlist_at ? fmtDateTime(r.promoted_from_waitlist_at) : null} />
          <Field label="Payment confirmed" value={r.confirmed_at ? fmtDateTime(r.confirmed_at) : null} />
          <Field label="Refunded" value={r.refunded_at ? fmtDateTime(r.refunded_at) : null} />
          <Field label="Refund reason" value={r.refund_reason} />
          <Field
            label="Last email"
            value={<EmailStatusCell registrationId={r.id} status={r.email_status} failureReason={r.email_failure_reason} />}
          />
        </Section>
      </div>

      <div className="mt-5 space-y-5">
        <EditEmailsCard r={r} onConfirm={setConfirmState} />
        {isSuperAdmin && <DeleteRegistrationCard r={r} campId={camp?.id ?? null} onConfirm={setConfirmState} />}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Button asChild variant="outline" size="sm" className="rounded-full border-border/60 bg-card/50"><a href={`mailto:${r.parent_email}`}><Mail className="mr-1.5 h-3.5 w-3.5" /> Email guardian</a></Button>
        <Button asChild variant="outline" size="sm" className="rounded-full border-border/60 bg-card/50"><a href={`tel:${r.parent_mobile}`}><Phone className="mr-1.5 h-3.5 w-3.5" /> Call guardian</a></Button>
      </div>

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
