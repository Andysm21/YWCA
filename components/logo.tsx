import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export type LogoSize = keyof typeof SIZES;

// Only one asset exists today (public/logo.png) — it has a dark navy
// wordmark baked in, which reads fine on light/neutral backgrounds but can
// lose contrast on very dark ones. `variant` is scaffolded for a future
// inverted/light asset (public/logo-light.png) if one gets provided; until
// then both variants render the same file. Flagging this rather than
// pretending an inverted asset exists.
export type LogoVariant = 'default' | 'inverted';

const VARIANT_SRC: Record<LogoVariant, string> = {
  default: '/logo.png',
  inverted: '/logo.png', // TODO: swap once a light/inverted asset is provided
};

export function Logo({
  size = 'md',
  variant = 'default',
  className,
  priority = false,
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const px = SIZES[size];
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: px, height: px }}>
      <Image
        src={VARIANT_SRC[variant]}
        alt="YWCA Camp Egypt"
        fill
        className="object-contain"
        priority={priority}
        sizes={`${px}px`}
      />
    </div>
  );
}
