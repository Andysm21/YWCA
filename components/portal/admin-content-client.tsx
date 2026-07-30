'use client';

import * as React from 'react';
import { ContentTab } from '@/components/portal/content-management';
import { ConfirmDialog, type ConfirmState } from '@/components/portal/confirm-dialog';
import type { Season, Camp } from '@/lib/camp-data';
import type { NewsPostRow } from '@/lib/queries/news';
import type { GalleryImageRow } from '@/lib/queries/gallery';

export function AdminContentClient(props: {
  seasons: Season[];
  camps: Camp[];
  newsPosts: NewsPostRow[];
  newsTotalCount: number;
  newsPage: number;
  galleryImages: GalleryImageRow[];
  galleryTotalCount: number;
  galleryPage: number;
}) {
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Content</h1>
        <p className="mt-1 text-muted-foreground">Manage news posts and gallery photos.</p>
      </div>

      <ContentTab {...props} basePath="/portal/admin/content" onConfirm={setConfirmState} />

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
