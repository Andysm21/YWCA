'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/utils';
import { validateNewsInput } from '@/lib/validation/news';
import type { NewsPostRow } from '@/lib/queries/news';
import type { GalleryImageRow } from '@/lib/queries/gallery';
import type { Season, Camp } from '@/lib/camp-data';
import type { ConfirmState } from '@/components/portal/confirm-dialog';

type OnConfirm = (s: NonNullable<ConfirmState>) => void;

/* ========== NEWS ========== */
const emptyNewsForm = { title: '', slug: '', content: '', cover_image_url: '', published_at: '' };
type NewsFormState = typeof emptyNewsForm;

function NewsForm({
  initial, onCancel, onSaved,
}: {
  initial: (NewsFormState & { id: string }) | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<NewsFormState>(initial ?? emptyNewsForm);
  const [slugTouched, setSlugTouched] = React.useState(!!initial);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  function set<K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateNewsInput(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const res = await fetch(initial ? `/api/portal/news/${initial.id}` : '/api/portal/news', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save news post');
      onSaved();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save news post']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-6">
      <h3 className="mb-4 font-display text-lg font-bold text-foreground">{initial ? 'Edit article' : 'Add article'}</h3>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} className="rounded-xl bg-background/50" />
          </div>
        </div>
        <div className="space-y-2"><Label>Content</Label><Textarea rows={5} value={form.content} onChange={(e) => set('content', e.target.value)} className="rounded-xl bg-background/50" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Cover image URL</Label><Input placeholder="https://..." value={form.cover_image_url} onChange={(e) => set('cover_image_url', e.target.value)} className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2">
            <Label>Publish date</Label>
            <Input type="datetime-local" value={form.published_at} onChange={(e) => set('published_at', e.target.value)} className="rounded-xl bg-background/50" />
            <p className="text-xs text-muted-foreground">Leave empty to save as a draft — guests only see published posts.</p>
          </div>
        </div>
        {errors.length > 0 && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="rounded-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} {initial ? 'Save changes' : 'Publish'}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

export function NewsSection({
  newsPosts, totalCount, page, basePath, onConfirm,
}: {
  newsPosts: NewsPostRow[];
  totalCount: number;
  page: number;
  /** e.g. '/portal/super-admin' or '/portal/admin/content' — pagination pushes here, preserving any other current search params (e.g. ?tab=content). */
  basePath: string;
  onConfirm: OnConfirm;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [editing, setEditing] = React.useState<NewsPostRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function updatePage(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set('newsPage', String(p));
    router.push(`${basePath}?${params.toString()}`);
  }

  function handleSaved() {
    setShowAdd(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(n: NewsPostRow) {
    setDeletingId(n.id);
    try {
      const res = await fetch(`/api/portal/news/${n.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete news post');
      router.refresh();
    } catch (err) {
      onConfirm({ title: 'Could not delete post', description: err instanceof Error ? err.message : 'Unknown error', onConfirm: () => {} });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="rounded-full glow-orange" onClick={() => { setEditing(null); setShowAdd((v) => !v); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add article
        </Button>
      </div>

      {showAdd && <NewsForm initial={null} onCancel={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editing && (
        <NewsForm
          initial={{
            id: editing.id, title: editing.title, slug: editing.slug, content: editing.content,
            cover_image_url: editing.cover_image_url ?? '',
            published_at: editing.published_at ? editing.published_at.slice(0, 16) : '',
          }}
          onCancel={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-3">
        {newsPosts.length === 0 && <p className="text-sm text-muted-foreground">No news posts yet.</p>}
        {newsPosts.map((n) => (
          <div key={n.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground">
                {n.published_at ? new Date(n.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => { setShowAdd(false); setEditing(n); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={deletingId === n.id}
              className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-300"
              onClick={() => onConfirm({
                title: `Delete "${n.title}"?`,
                description: 'This news article will be permanently removed. This action cannot be undone.',
                onConfirm: () => handleDelete(n),
              })}
            >
              {deletingId === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page <= 1} onClick={() => updatePage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page >= totalPages} onClick={() => updatePage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ========== GALLERY ========== */
// Downscale to max 1920px JPEG so uploads stay well under the serverless
// request-size limit and the public gallery loads fast. PNG/WebP are
// re-encoded as JPEG; falls back to the original file if decoding fails.
async function resizeImage(file: File, maxDim = 1920, quality = 0.85): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function GallerySection({
  galleryImages, totalCount, page, basePath, seasons, camps, onConfirm,
}: {
  galleryImages: GalleryImageRow[];
  totalCount: number;
  page: number;
  basePath: string;
  seasons: Season[];
  camps: Camp[];
  onConfirm: OnConfirm;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [progress, setProgress] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [caption, setCaption] = React.useState('');
  const [campId, setCampId] = React.useState('');
  const [seasonId, setSeasonId] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function updatePage(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set('galleryPage', String(p));
    router.push(`${basePath}?${params.toString()}`);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError('Choose at least one photo.');
      return;
    }
    setSubmitting(true);
    const failures: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}...`);
        try {
          const resized = await resizeImage(files[i]);
          const body = new FormData();
          body.append('file', resized);
          body.append('caption', caption);
          body.append('camp_id', campId);
          body.append('season_id', seasonId);
          const res = await fetch('/api/portal/gallery/upload', { method: 'POST', body });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Upload failed');
        } catch (err) {
          failures.push(`${files[i].name}: ${err instanceof Error ? err.message : 'Upload failed'}`);
        }
      }
      if (failures.length < files.length) router.refresh();
      if (failures.length === 0) {
        setFiles([]); setCaption(''); setCampId(''); setSeasonId(''); setShowAdd(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(failures.join(' • '));
      }
    } finally {
      setProgress(null);
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portal/gallery/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete image');
      router.refresh();
    } catch (err) {
      onConfirm({ title: 'Could not delete image', description: err instanceof Error ? err.message : 'Unknown error', onConfirm: () => {} });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="rounded-full glow-orange" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" /> Upload photos
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 grid gap-4 rounded-2xl border border-border/60 bg-card/50 p-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Photos (JPG, PNG or WebP — you can pick several)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="rounded-xl bg-background/50 file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-primary"
            />
            {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} photo{files.length === 1 ? '' : 's'} selected</p>}
          </div>
          <div className="space-y-2"><Label>Caption (optional, applied to all selected)</Label><Input value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-xl bg-background/50" /></div>
          <div className="space-y-2">
            <Label>Season (optional)</Label>
            <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm">
              <option value="">None</option>
              {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Camp (optional)</Label>
            <select value={campId} onChange={(e) => setCampId(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-sm">
              <option value="">None</option>
              {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-rose-400 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm" className="rounded-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} {progress ?? 'Upload'}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {galleryImages.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No gallery images yet.</p>}
        {galleryImages.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.caption ?? ''} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
              <Button
                size="icon"
                variant="ghost"
                disabled={deletingId === img.id}
                className="h-8 w-8 rounded-full bg-background/70 text-rose-400"
                onClick={() => onConfirm({
                  title: 'Delete this photo?',
                  description: 'This image will be permanently removed from the gallery. This action cannot be undone.',
                  onConfirm: () => handleDelete(img.id),
                })}
              >
                {deletingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page <= 1} onClick={() => updatePage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/60 bg-transparent" disabled={page >= totalPages} onClick={() => updatePage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ========== TOP-LEVEL TAB (news/gallery toggle) ========== */
export function ContentTab({
  seasons, camps, newsPosts, newsTotalCount, newsPage, galleryImages, galleryTotalCount, galleryPage, basePath, onConfirm,
}: {
  seasons: Season[];
  camps: Camp[];
  newsPosts: NewsPostRow[];
  newsTotalCount: number;
  newsPage: number;
  galleryImages: GalleryImageRow[];
  galleryTotalCount: number;
  galleryPage: number;
  basePath: string;
  onConfirm: OnConfirm;
}) {
  const [section, setSection] = React.useState<'news' | 'gallery'>('news');

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-full border border-border/60 bg-card/50 p-1.5">
        {(['news', 'gallery'] as const).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={cn('rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all',
              section === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {s === 'news' ? 'News & Updates' : 'Photo Gallery'}
          </button>
        ))}
      </div>

      {section === 'news' && <NewsSection newsPosts={newsPosts} totalCount={newsTotalCount} page={newsPage} basePath={basePath} onConfirm={onConfirm} />}
      {section === 'gallery' && <GallerySection galleryImages={galleryImages} totalCount={galleryTotalCount} page={galleryPage} basePath={basePath} seasons={seasons} camps={camps} onConfirm={onConfirm} />}
    </div>
  );
}
