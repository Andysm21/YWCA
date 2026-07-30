'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmState = { title: string; description: string; onConfirm: () => void } | null;

/** Shared destructive-action confirmation dialog — used by both the Admin and Super Admin panels' Content tabs (and Super Admin's Seasons/Camps/Staff tabs). */
export function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  if (!state) return null;
  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            {state.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-rose-500 text-white hover:bg-rose-600"
            onClick={() => { state.onConfirm(); onClose(); }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
