import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { TemplateShowcase } from "@/components/template-showcase";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <TemplateShowcase />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
