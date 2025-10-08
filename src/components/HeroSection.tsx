import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";
<<<<<<< HEAD
import { useTranslation } from "react-i18next";

type HeroCardContent = {
  title: string;
  description: string;
  button: string;
};

const HeroSection = () => {
  const { t } = useTranslation();
  const cards = t("landing.hero.cards", { returnObjects: true }) as HeroCardContent[];
  const cardIcons = [BookOpen, Users, Award];

=======
const HeroSection = () => {
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
  return <section className="relative bg-gradient-hero pt-28 pb-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
<<<<<<< HEAD
            {t("landing.hero.title")} 
            <span className="block md:inline text-white font-bold"> {t("landing.hero.titleHighlight")}</span>
          </h1>
          <p className="text-xl mb-12 leading-relaxed max-w-3xl mx-auto text-white/90">
            {t("landing.hero.subtitle")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16 text-center space-y-6">
          <p className="text-lg md:text-xl text-white/80">{t("landing.hero.lead")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft px-10 h-12"
              onClick={() => (window.location.href = '/auth-new')}
            >
              {t("landing.hero.leadButton")}
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-10 h-12"
              onClick={() => (window.location.href = '/auth')}
            >
              {t("landing.hero.loginButton")}
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
=======
            Your Gateway to 
            <span className="block md:inline text-white font-bold"> Global Universities</span>
          </h1>
          <p className="text-xl mb-12 leading-relaxed max-w-3xl mx-auto text-white/90">
            Access world-class education opportunities across 105+ countries. Connect with top universities worldwide, 
            explore diverse programs at the best prices, and start your journey towards academic excellence.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16 text-center space-y-4">
          <p className="text-lg md:text-xl text-white/80">
            Ready to find your perfect program? Create your free account to discover personalised opportunities tailored to your goals.
          </p>
          <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft px-10 h-12"
            onClick={() => window.location.href = '/auth-new'}>
            Get Started
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
<<<<<<< HEAD
          {cards.map((card, index) => {
            const Icon = cardIcons[index];
            return (
              <div key={card.title} className="bg-card rounded-2xl p-8 shadow-elegant border border-border hover:shadow-glow transition-shadow">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
                  {Icon && <Icon className="h-8 w-8 text-primary-foreground" />}
                </div>
                <h3 className="font-semibold text-foreground text-xl mb-4">{card.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {card.description}
                </p>
                <Button variant="outline" className="group">
                  {card.button}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            );
          })}
=======
          <div className="bg-card rounded-2xl p-8 shadow-elegant border border-border hover:shadow-glow transition-shadow">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-xl mb-4">10,000+ Programs</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Explore thousands of degree programs across 105+ countries, from engineering to arts, all at competitive prices with world-class facilities.
            </p>
            <Button variant="outline" className="group">
              Explore Programs
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-elegant border border-border hover:shadow-glow transition-shadow">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-xl mb-4">2,000+ Universities</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Partner with top-ranked institutions across 105+ countries worldwide, from prestigious European universities to leading American colleges.
            </p>
            <Button variant="outline" className="group">
              View Universities
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-elegant border border-border hover:shadow-glow transition-shadow">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
              <Award className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-xl mb-4">Best Prices Guaranteed</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Get the best tuition rates and scholarship opportunities worldwide, with transparent pricing and no hidden fees for quality education.
            </p>
            <Button variant="outline" className="group">
              Learn More
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft px-10 py-4 text-lg">
<<<<<<< HEAD
            {t("landing.hero.primaryCta")}
=======
            Start Your Application Journey
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          
          {/* University Official CTA */}
          <div className="pt-8 border-t border-border/50">
            <p className="text-white/80 text-lg mb-4">
<<<<<<< HEAD
              {t("landing.hero.universityPrompt")}
=======
              Represent your university on our platform?
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </p>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-8 py-3"
              onClick={() => window.location.href = '/auth-university'}
            >
<<<<<<< HEAD
              {t("landing.hero.universityCta")}
=======
              University Official Registration
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;
