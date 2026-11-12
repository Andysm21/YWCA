import Link from 'next/link';
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from 'lucide-react';
import { getPublicSiteSettings } from '@/lib/queries/site-settings';
import { DEFAULT_INSTAGRAM_URL } from '@/lib/site-settings-shared';
import { Logo } from '@/components/logo';

const nav = {
  Camps: [{ label: 'All Camps', href: '/camps' }, { label: 'Calendar', href: '/calendar' }, { label: 'Registration', href: '/camps' }],
  About: [{ label: 'Our mission', href: '/about' }, { label: 'Gallery', href: '/gallery' }],
  Resources: [{ label: 'FAQ', href: '/faq' }, { label: 'Packing List', href: '/packing' }],
};

export async function Footer() {
  const settings = await getPublicSiteSettings();
  const socials = [
    { label: 'Facebook', Icon: Facebook, href: settings.facebook },
    { label: 'Instagram', Icon: Instagram, href: settings.instagram || DEFAULT_INSTAGRAM_URL },
    { label: 'Twitter', Icon: Twitter, href: settings.twitter },
  ].filter((x) => x.href);
  const hasContact = !!(settings.email || settings.phone || settings.address);
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-border/60 bg-gradient-to-b from-background to-card/30 print:hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="group flex items-center gap-2.5">
              <Logo size="md" className="transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_14px_hsl(var(--primary)/0.45)]" />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">YWCA Camp</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The Camp - by the YWCA. A fun-filled, character-building experience
              with a simplistic lifestyle and team-based activities.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ label, Icon, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/40 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(nav).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{heading}</h3>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {hasContact && (
          <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
            {settings.address && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> {settings.address}</span>}
            {settings.email && <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><Mail className="h-4 w-4 text-primary" /> {settings.email}</a>}
            {settings.phone && <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><Phone className="h-4 w-4 text-primary" /> {settings.phone}</a>}
          </div>
        )}
        <p className="mt-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} YWCA Camp.</p>
      </div>
    </footer>
  );
}
