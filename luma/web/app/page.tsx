import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Features, HowItWorks, Benefits, Testimonials, CTASection } from '@/components/Sections';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
