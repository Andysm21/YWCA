import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth/require-staff';
import { CONTACT_SETTING_KEYS, type PublicSiteSettings } from '@/lib/site-settings-shared';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d][\d\s().-]{5,18}\d$/;

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Saves the Super Admin "Settings" tab. An empty value removes the setting (so the public site hides it). */
export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const get = (k: keyof PublicSiteSettings) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');
  const v: PublicSiteSettings = {
    announcement: get('announcement'),
    email: get('email'),
    phone: get('phone'),
    address: get('address'),
    facebook: get('facebook'),
    instagram: get('instagram'),
    twitter: get('twitter'),
  };

  if (v.announcement.length > 200) return NextResponse.json({ error: 'Announcement must be 200 characters or fewer.' }, { status: 400 });
  if (v.address.length > 200) return NextResponse.json({ error: 'Address must be 200 characters or fewer.' }, { status: 400 });
  if (v.email && (!EMAIL_PATTERN.test(v.email) || v.email.length > 200)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (v.phone && !PHONE_PATTERN.test(v.phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  for (const [label, url] of [['Facebook', v.facebook], ['Instagram', v.instagram], ['Twitter', v.twitter]] as const) {
    if (url && (!isHttpUrl(url) || url.length > 500)) return NextResponse.json({ error: `${label} link must be a full URL starting with https://` }, { status: 400 });
  }

  const toSave: [string, string][] = [];
  const toDelete: string[] = [];
  for (const field of Object.keys(CONTACT_SETTING_KEYS) as (keyof PublicSiteSettings)[]) {
    const key = CONTACT_SETTING_KEYS[field];
    if (v[field]) toSave.push([key, v[field]]);
    else toDelete.push(key);
  }

  if (toSave.length > 0) {
    const { error } = await supabase
      .from('site_settings')
      .upsert(toSave.map(([key, value]) => ({ key, value, updated_by: userId })), { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (toDelete.length > 0) {
    const { error } = await supabase.from('site_settings').delete().in('key', toDelete);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
