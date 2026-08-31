import type { ReactNode } from 'react';

interface ContentPageProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function ContentPage({ children, description, eyebrow, title }: Readonly<ContentPageProps>) {
  return (
    <div className="mx-auto grid w-full max-w-prose gap-10 px-4 py-12 sm:px-6 lg:py-20">
      <header className="grid gap-4">
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">{eyebrow}</p>
        <h1 className="text-neutral-100 text-4xl leading-tight font-semibold tracking-[-0.035em] sm:text-5xl">
          {title}
        </h1>
        <p className="text-neutral-400 max-w-reading text-base leading-relaxed sm:text-lg">
          {description}
        </p>
      </header>

      {children}
    </div>
  );
}
