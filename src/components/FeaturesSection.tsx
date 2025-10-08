import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Shield, Users, ArrowRight, CheckCircle } from "lucide-react";
<<<<<<< HEAD
import { useTranslation } from "react-i18next";

type FeatureContent = {
  title: string;
  description: string;
  highlights: string[];
};

const FeaturesSection = () => {
  const { t } = useTranslation();
  const featureContent = t("landing.features.items", { returnObjects: true }) as FeatureContent[];
  const featureIcons = [FileText, MessageSquare, Users, Shield];
=======

const FeaturesSection = () => {
  const features = [
    {
      icon: FileText,
      title: "Simplified Applications",
      description: "Streamlined application process with step-by-step guidance and document management.",
      highlights: ["One-click applications", "Document verification", "Real-time status updates"]
    },
    {
      icon: MessageSquare,
      title: "Secure Chat",
      description: "Direct communication with university admissions offices through our secure messaging platform.",
      highlights: ["Direct university contact", "File sharing", "Translation support"]
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Personal guidance from our team of education consultants throughout your journey.",
      highlights: ["Personalized counseling", "Application review", "Interview preparation"]
    },
    {
      icon: Shield,
      title: "Secure & Verified",
      description: "All universities are verified partners with secure data handling and privacy protection.",
      highlights: ["Verified universities", "Data encryption", "Privacy guaranteed"]
    }
  ];
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
<<<<<<< HEAD
            {t("landing.features.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
=======
            Why Choose UnivGates?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We make studying in Turkey accessible, simple, and secure for international students worldwide.
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
<<<<<<< HEAD
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
=======
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
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
          ))}
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
<<<<<<< HEAD
            {t("landing.features.cta")}
=======
            Learn More About Our Services
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

<<<<<<< HEAD
export default FeaturesSection;
=======
export default FeaturesSection;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
