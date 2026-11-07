import { Navbar } from '@/components/sections/navbar';
import { Footer } from '@/components/sections/footer';
import { getPublicSiteSettings } from '@/lib/queries/site-settings';

// Footer contact details / announcement come from the Super Admin settings; re-check them often.
export const revalidate = 30;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { announcement } = await getPublicSiteSettings();
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16">
        {announcement && (
          <div className="relative z-10 bg-gradient-to-r from-brand-orange to-brand-ember px-4 py-2 text-center text-sm font-semibold text-white print:hidden">
            {announcement}
          </div>
        )}
        {children}
      </div>
      <Footer />
    </>
  );
}
