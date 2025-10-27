import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Shield, Users, ArrowRight, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type FeatureContent = {
  title: string;
  description: string;
  highlights: string[];
};

const FeaturesSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const featureContent = t("landing.features.items", { returnObjects: true }) as FeatureContent[];
  const featureIcons = [FileText, MessageSquare, Users, Shield];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {featureContent.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <Card key={index} className="border-border/50 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {Icon && <Icon className="h-8 w-8 text-primary-foreground" />}
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-accent mr-2" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => navigate("/auth-new?tab=register&type=student")}
          >
            {t("landing.features.cta")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
