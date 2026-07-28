'use client';

import * as React from 'react';
import { MapPin, Mail, Phone, Clock, Send, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const contactInfo = [
  { icon: MapPin, label: 'Location', value: 'Ras Sedr, South Sinai, Egypt' },
  { icon: Mail, label: 'Email', value: 'hello@ywcacamp.org' },
  { icon: Phone, label: 'Phone', value: '+20 100 000 0000' },
  { icon: Clock, label: 'Office hours', value: 'Sun–Thu, 9 AM – 5 PM EET' },
];

export function ContactContent() {
  const [sent, setSent] = React.useState(false);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        {/* Info */}
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Reach the camp</h2>
          <p className="mt-3 text-muted-foreground">
            Whether it's a registration question, a volunteering interest, or just
            saying hello — we'd love to hear from you.
          </p>
          <div className="mt-8 space-y-4">
            {contactInfo.map((c) => (
              <div key={c.label} className="flex items-start gap-4 rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><c.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
                  <p className="mt-0.5 font-semibold text-white">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Follow us</p>
            <div className="mt-3 flex items-center gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/40 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
            <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-brand-teal/15 via-card to-brand-orange/10">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative text-center">
                <MapPin className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-2 font-semibold text-white">Ras Sedr, South Sinai</p>
                <p className="text-xs text-muted-foreground">Map will be embedded here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><Send className="h-8 w-8" /></div>
              <h3 className="font-display text-xl font-bold text-white">Message sent!</h3>
              <p className="mt-2 text-sm text-muted-foreground">We'll get back to you within 2 business days.</p>
              <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSent(false)}>Send another</Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" placeholder="Mariam" required className="rounded-xl bg-background/50" /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" placeholder="Adel" required className="rounded-xl bg-background/50" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" required className="rounded-xl bg-background/50" /></div>
              <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" placeholder="Registration question" className="rounded-xl bg-background/50" /></div>
              <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" placeholder="Tell us how we can help..." rows={5} required className="rounded-xl bg-background/50" /></div>
              <Button type="submit" size="lg" className="w-full rounded-full glow-orange">Send message<Send className="ml-2 h-4 w-4" /></Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
