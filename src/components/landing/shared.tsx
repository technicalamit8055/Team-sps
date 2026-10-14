import React, { useEffect, useRef, useState } from 'react';

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

/**
 * Fades its children up the first time they scroll into view. Browsers without
 * IntersectionObserver (and reduced-motion users, via CSS) get the content
 * shown immediately, so nothing can stay invisible.
 */
export const Reveal: React.FC<RevealProps> = ({ delay = 0, className = '', style, children, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  );
};

interface SectionKickerProps {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}

/** Small rule-and-label line that sits above every section heading. */
export const SectionKicker: React.FC<SectionKickerProps> = ({ children, tone = 'light', className = '' }) => (
  <span
    className={`inline-flex items-center gap-3 text-sm font-bold tracking-wide ${
      tone === 'dark' ? 'text-marigold' : 'text-kesar-deep'
    } ${className}`}
  >
    <span className={`h-px w-8 ${tone === 'dark' ? 'bg-marigold' : 'bg-kesar'}`} />
    {children}
  </span>
);

/** A small eight-ray sun, used as a separator in the slogan band and footer. */
export const SunGlyph: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="4.2" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x="11" y="1" width="2" height="5" rx="1" transform={`rotate(${i * 45} 12 12)`} />
    ))}
  </svg>
);
