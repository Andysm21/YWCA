'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 120px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        // phones: always visible, no scroll-triggered animation (it lagged/hid content on iOS Safari)
        'max-md:!translate-y-0 max-md:!opacity-100 max-md:!transition-none',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
