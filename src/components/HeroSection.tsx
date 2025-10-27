import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type HeroCardContent = {
  title: string;
  description: string;
  button: string;
};

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToAuthNew = (search = "") => {
    const query = search ? `?${search}` : "";
    navigate(`/auth-new${query}`);
  };

  const cards = t("landing.hero.cards", { returnObjects: true }) as HeroCardContent[];
  const cardIcons = [BookOpen, Users, Award];
  const cardActions: Array<() => void> = [
    () => goToAuthNew("tab=register&type=student"),
    () => goToAuthNew("tab=register&type=student"),
    () => scrollToSection("features"),
  ];

  return (
    <section className="relative bg-gradient-hero pt-28 pb-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative max-w-5xl mx-auto mb-24 text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            {t("landing.hero.title")}
            <span className="block md:inline text-white font-bold"> {t("landing.hero.titleHighlight")}</span>
          </h1>
          <p className="text-xl leading-relaxed text-white/90">
            {t("landing.hero.subtitle")}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {cards.map((card, index) => {
            const Icon = cardIcons[index];
            const handleCardClick = cardActions[index] ?? cardActions[0];
            return (
              <div key={card.title} className="bg-card rounded-2xl p-8 shadow-elegant border border-border hover:shadow-glow transition-shadow">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
                  {Icon && <Icon className="h-8 w-8 text-primary-foreground" />}
                </div>
                <h3 className="font-semibold text-foreground text-xl mb-4">{card.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {card.description}
                </p>
                <Button
                  variant="outline"
                  className="group"
                  onClick={handleCardClick}
                >
                  {card.button}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto mb-16 text-center">
          <p className="text-lg md:text-xl text-white/80">{t("landing.hero.lead")}</p>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <Button
            size="lg"
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft px-10 py-4 text-lg"
            onClick={() => goToAuthNew("tab=register&type=student")}
          >
            {t("landing.hero.primaryCta")}
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          
          {/* University Official CTA */}
          <div className="pt-8 border-t border-border/50">
            <p className="text-white/80 text-lg mb-4">
              {t("landing.hero.universityPrompt")}
            </p>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-8 py-3"
              onClick={() => goToAuthNew("tab=register&type=university")}
            >
              {t("landing.hero.universityCta")}
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
