import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const phoneNumber = t("landing.ctaSection.phone") as string;
  const sanitizedPhone = phoneNumber.replace(/\s+/g, "");
  const emailAddress = t("landing.ctaSection.email") as string;

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="cta" className="py-20 bg-gradient-hero relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-background mb-6">
            {t("landing.ctaSection.titleLine1")}
            <span className="block text-primary-glow">{t("landing.ctaSection.titleLine2")}</span>
          </h2>
          
          <p className="text-lg md:text-xl text-background/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t("landing.ctaSection.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4"
              onClick={() => navigate("/auth-new?tab=register&type=student")}
            >
              {t("landing.ctaSection.applyNow")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-background/30 text-background hover:bg-background/10 text-lg px-8 py-4"
              onClick={() => scrollToSection("contact")}
            >
              {t("landing.ctaSection.scheduleConsultation")}
            </Button>
          </div>

          <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-8 border border-background/20 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-background mb-4">
              {t("landing.ctaSection.helpTitle")}
            </h3>
            <p className="text-background/80 mb-6">
              {t("landing.ctaSection.helpDescription")}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`tel:${sanitizedPhone}`}
                className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-background/10 hover:bg-background/20 transition-colors"
              >
                <Phone className="h-5 w-5 text-background" />
                <div className="text-left">
                  <div className="text-background font-medium">{t("landing.ctaSection.callUs")}</div>
                  <div className="text-background/70 text-sm">{phoneNumber}</div>
                </div>
              </a>
              
              <a
                href={`mailto:${emailAddress}`}
                className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-background/10 hover:bg-background/20 transition-colors"
              >
                <Mail className="h-5 w-5 text-background" />
                <div className="text-left">
                  <div className="text-background font-medium">{t("landing.ctaSection.emailUs")}</div>
                  <div className="text-background/70 text-sm">{emailAddress}</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-background/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-primary-glow/20 rounded-full blur-2xl"></div>
    </section>
  );
};

export default CTASection;
