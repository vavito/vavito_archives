import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Vavito Archives',
  description: 'Arquivo digital de artigos e ideias.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
