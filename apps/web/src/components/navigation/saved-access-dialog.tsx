'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  buttonVariants,
} from '@vavito/ui';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

interface SavedAccessDialogProps {
  onOpenChange: (open: boolean) => void;
}

export default function SavedAccessDialog({ onOpenChange }: Readonly<SavedAccessDialogProps>) {
  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entre para ver seus artigos salvos</DialogTitle>
          <DialogDescription>
            Você precisa acessar sua conta para ver os artigos que guardou para ler depois.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Agora não
          </Button>
          <Link
            className={buttonVariants({ variant: 'primary' })}
            href="/auth?next=/salvos"
            onClick={() => onOpenChange(false)}
            prefetch={false}
          >
            <LogIn aria-hidden="true" />
            Ir para o login
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
