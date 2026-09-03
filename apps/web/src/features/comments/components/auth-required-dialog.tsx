'use client';

import {
  buttonVariants,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vavito/ui';
import { LogIn } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

interface AuthRequiredDialogProps {
  articlePath: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function AuthRequiredDialog({
  articlePath,
  onOpenChange,
  open,
}: Readonly<AuthRequiredDialogProps>) {
  const authPath = `/auth?next=${encodeURIComponent(articlePath)}`;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entre para participar</DialogTitle>
          <DialogDescription>
            Para comentar ou responder, entre na sua conta ou crie uma gratuitamente. Depois você
            voltará para este artigo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <button className={buttonVariants({ variant: 'secondary' })} type="button">
              Continuar lendo
            </button>
          </DialogClose>
          <Link className={buttonVariants()} href={authPath as Route}>
            <LogIn aria-hidden="true" className="size-4" />
            Entrar ou criar conta
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
