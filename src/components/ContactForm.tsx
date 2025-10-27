import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  message: string;
}

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast({
        title: t("landing.contactForm.notifications.missingFieldsTitle"),
        description: t("landing.contactForm.notifications.missingFieldsDescription"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("contact_forms")
        .insert({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone_number: formData.phoneNumber.trim() || null,
          interested_program: formData.message.trim() || null,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: t("landing.contactForm.notifications.successTitle"),
        description: t("landing.contactForm.notifications.successDescription"),
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: t("landing.contactForm.notifications.errorTitle"),
        description: t("landing.contactForm.notifications.errorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-elegant border-0 bg-gradient-subtle">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {t("landing.contactForm.successTitle")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("landing.contactForm.successDescription")}
          </p>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ fullName: "", email: "", phoneNumber: "", message: "" });
            }}
            variant="outline"
            className="transition-all duration-300 hover:shadow-soft"
          >
            {t("landing.contactForm.sendAnother")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-elegant border-0 bg-gradient-subtle">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-foreground">
          {t("landing.contactForm.title")}
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          {t("landing.contactForm.subtitle")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
              {t("landing.contactForm.labels.fullName")}
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card"
              placeholder={t("landing.contactForm.placeholders.fullName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              {t("landing.contactForm.labels.email")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card"
              placeholder={t("landing.contactForm.placeholders.email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
              {t("landing.contactForm.labels.phone")}
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card"
              placeholder={t("landing.contactForm.placeholders.phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-foreground">
              {t("landing.contactForm.labels.message")}
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card resize-none"
              placeholder={t("landing.contactForm.placeholders.message")}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-primary-foreground font-medium py-3"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>{t("landing.contactForm.submitting")}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Send className="w-4 h-4" />
                <span>{t("landing.contactForm.submit")}</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
