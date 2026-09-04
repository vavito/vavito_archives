import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@web/features/auth';

export const metadata: Metadata = {
  description: 'Receba um link seguro para recuperar o acesso ao Vavito Archives.',
  title: 'Recuperar senha',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
