'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/* ================= TYPES ================= */

export interface DeleteDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/* ================= COMPONENT ================= */

export function DeleteDialog({
  isOpen,
  isLoading,
  title = 'Delete item?',
  description = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDangerous = true,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isLoading && !open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-end gap-3">
          <AlertDialogCancel
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>

          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={isDangerous ? "destructive" : "default"}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                Deleting
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}