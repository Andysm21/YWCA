import { Navbar } from '@/components/sections/navbar';
import { Footer } from '@/components/sections/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16">{children}</div>
      <Footer />
    </>
  );
}
