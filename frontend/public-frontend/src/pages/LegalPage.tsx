import { ReactNode } from 'react';

/** Shared layout for the privacy policy and terms pages */
export default function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-x py-14 sm:py-20">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-muted">{intro}</p>
        </div>
      </section>
      <section className="container-x py-14">
        <div className="mx-auto max-w-3xl space-y-10 text-[15px] leading-relaxed text-ink/80 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
          {children}
        </div>
      </section>
    </>
  );
}
