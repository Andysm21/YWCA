import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google';
import { RoleProvider } from '@/components/role-context';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ywcacamp.org'),
  title: 'YWCA Camp — A Character-Building Camping Experience in Ras Sedr',
  description:
    'A fun-filled character building camping experience on the Red Sea coast. Summer & Winter seasons for kids, teens, and young leaders. Register now.',
  openGraph: {
    title: 'YWCA Camp — Ras Sedr, Egypt',
    description:
      'A fun-filled character building camping experience that promotes a healthy, sustainable, simplistic lifestyle.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
