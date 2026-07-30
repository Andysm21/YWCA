'use client';

import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type Column<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  pageSize = 8,
  searchKeys,
}: {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchKeys: (keyof T)[];
}) {
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    let result = [...data];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((k) => String(row[k]).toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        let cmp = 0;
        if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortDir, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden">
      <div className="border-b border-border/60 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search registrations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="rounded-full bg-background/50 pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 text-left">
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(String(col.key))}
                      className="inline-flex items-center gap-1 font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 opacity-30" />
                      )}
                    </button>
                  ) : (
                    <span className="font-semibold text-muted-foreground">{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  No registrations found.
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-foreground/90">
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} total · Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-border/60 bg-transparent"
            disabled={currentPage === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-border/60 bg-transparent"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
