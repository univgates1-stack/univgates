import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

type Testimonial = {
  name: string;
  country: string;
  university: string;
  program: string;
  image: string;
  quote: string;
};

type Statistic = {
  value: string;
  label: string;
};

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const testimonials = t("landing.testimonials.items", { returnObjects: true }) as Testimonial[];
  const statistics = t("landing.testimonials.statistics", { returnObjects: true }) as Statistic[];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative bg-background border-border/50 hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{testimonial.image}</div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.country}</p>
                    <div className="flex items-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                </div>
                
                <Quote className="h-6 w-6 text-accent mb-3" />
                <p className="text-muted-foreground mb-4 italic">
                  “{testimonial.quote}”
                </p>
                
                <div className="border-t border-border/30 pt-4">
                  <p className="text-sm font-medium text-foreground">{testimonial.university}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.program}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border/30">
          <div className="flex items-center justify-center space-x-8 mb-6">
            {statistics.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">
            {t("landing.testimonials.footnote")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
