import React from 'react';
import { SunGlyph } from '@/components/landing/shared';

const SLOGANS = ['सेवा', 'समर्पण', 'तकनीक', 'पारदर्शिता', 'युवा शक्ति', 'जन-जन का सम्मान', 'हर वर्ग का उत्थान'];

/** Campaign-banner strip of the movement's core words, edged with a marigold toran. */
export const SloganMarquee: React.FC = () => {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {SLOGANS.map((slogan) => (
        <li key={slogan} className="flex items-center whitespace-nowrap">
          <span className="px-6 font-display text-2xl sm:text-3xl">{slogan}</span>
          <SunGlyph className="h-5 w-5 text-marigold" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative z-10">
      <section aria-label="Team SPS के मूल मंत्र" className="overflow-hidden bg-kesar py-4 text-white sm:py-5">
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          {row(false)}
          {row(true)}
        </div>
      </section>
      <div aria-hidden="true" className="toran-edge absolute inset-x-0 top-full" />
    </div>
  );
};
