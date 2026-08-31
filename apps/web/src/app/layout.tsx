import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { QueryProvider } from '@web/providers/query-provider';
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@web/lib/seo/site';

import './globals.css';

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetBrainsMono = JetBrains_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
  creator: SITE_AUTHOR,
  description: SITE_DESCRIPTION,
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  metadataBase: SITE_URL,
  openGraph: {
    description: SITE_DESCRIPTION,
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: SITE_NAME,
    type: 'website',
    url: SITE_URL,
  },
  publisher: SITE_AUTHOR,
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    index: true,
  },
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  twitter: {
    card: 'summary_large_image',
    description: SITE_DESCRIPTION,
    title: SITE_NAME,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={`${inter.variable} ${jetBrainsMono.variable}`}
      lang={SITE_LANGUAGE}
      data-theme="dark"
    >
      <body className="bg-background text-foreground antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
