'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Tent } from 'lucide-react';

const nav = {
  Camps: [{ label: 'All Camps', href: '/camps' }, { label: 'Calendar', href: '/calendar' }, { label: 'Register', href: '/camps' }],
  About: [{ label: 'Our mission', href: '/about' }, { label: 'Leaders', href: '/about' }, { label: 'Gallery', href: '/gallery' }],
  Resources: [{ label: 'News', href: '/news' }, { label: 'FAQ', href: '/faq' }, { label: 'Packing List', href: '/packing' }, { label: 'Contact', href: '/contact' }],
};

export function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-border/60 bg-gradient-to-b from-background to-card/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-ember text-white shadow-[0_0_20px_-2px_hsl(22_95%_56%/0.5)]">
                <Tent className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">YWCA Camp</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A fun-filled character building camping experience that promotes a
              healthy, sustainable, simplistic lifestyle.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/40 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(nav).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{heading}</h3>
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

        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> Ras Sedr, South Sinai, Egypt</span>
            <a href="mailto:hello@ywcacamp.org" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><Mail className="h-4 w-4 text-primary" /> hello@ywcacamp.org</a>
            <a href="tel:+201000000000" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><Phone className="h-4 w-4 text-primary" /> +20 100 000 0000</a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} YWCA Camp. Built with care in Egypt.</p>
        </div>
      </div>
    </footer>
  );
}
