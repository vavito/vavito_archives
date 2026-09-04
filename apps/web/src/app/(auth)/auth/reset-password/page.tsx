import type { Metadata } from 'next';

import { ResetPasswordForm } from '@web/features/auth';

export const metadata: Metadata = {
  description: 'Crie uma nova senha para sua conta no Vavito Archives.',
  title: 'Alterar senha',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
