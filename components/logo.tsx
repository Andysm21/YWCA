import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export type LogoSize = keyof typeof SIZES;

// Both assets have transparent backgrounds. logo.png has the dark navy
// wordmark (for light mode); logo-light.png is the same artwork with the
// wordmark recoloured cream (for dark mode). Swapped with the `dark:` class
// variant, so it follows the site's theme with no client JS.
// `variant` is kept for API compatibility with existing callers.
export type LogoVariant = 'default' | 'inverted';

export function Logo({
  size = 'md',
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
        src="/logo.png"
        alt="YWCA Camp Egypt"
        fill
        className="object-contain dark:hidden"
        priority={priority}
        sizes={`${px}px`}
      />
      <Image
        src="/logo-light.png"
        alt=""
        aria-hidden
        fill
        className="hidden object-contain dark:block"
        priority={priority}
        sizes={`${px}px`}
      />
    </div>
  );
}
