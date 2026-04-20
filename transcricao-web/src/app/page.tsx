import Navbar from "@/components/Navbar";
import AppShowcase from "@/components/AppShowcase";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";
import Requirements from "@/components/Requirements";
import PricingSection from "@/components/PricingSection";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import HeroContent from "@/components/HeroContent";
import HeroBackground from "@/components/HeroBackground";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />

      {/* === HERO === */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* Three.js Background */}
        <div className="absolute inset-0 -z-10">
          <HeroBackground />
          {/* CSS fallback gradient while Three.js loads */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-0 via-surface-0 to-transparent" />
          {/* Radial glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-brand-cyan/[0.03] rounded-full blur-[150px]" />
        </div>

        <HeroContent />
      </section>

      {/* === SHOWCASE === */}
      <AppShowcase />

      {/* Separator */}
      <div className="section-line max-w-4xl mx-auto" />

      {/* === FEATURES === */}
      <Features />

      {/* === HOW IT WORKS === */}
      <HowItWorks />

      {/* === STATS === */}
      <Stats />

      {/* Separator */}
      <div className="section-line max-w-4xl mx-auto" />

      {/* === REQUIREMENTS === */}
      <Requirements />

      {/* Separator */}
      <div className="section-line max-w-4xl mx-auto" />

      {/* === PRICING === */}
      <PricingSection />

      {/* === FAQ === */}
      <FAQ />

      {/* === FINAL CTA === */}
      <FinalCTA />

      {/* === FOOTER === */}
      <Footer />
    </main>
  );
}
