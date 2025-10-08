import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Send } from "lucide-react";
<<<<<<< HEAD
import { useTranslation } from "react-i18next";
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

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
<<<<<<< HEAD
  const { t } = useTranslation();
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

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
<<<<<<< HEAD
        title: t("landing.contactForm.notifications.missingFieldsTitle"),
        description: t("landing.contactForm.notifications.missingFieldsDescription"),
=======
        title: "Required fields missing",
        description: "Please fill in your name and email address.",
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
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
<<<<<<< HEAD
        title: t("landing.contactForm.notifications.successTitle"),
        description: t("landing.contactForm.notifications.successDescription"),
=======
        title: "Message sent successfully!",
        description: "Thank you for your interest. We'll get back to you soon.",
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
<<<<<<< HEAD
        title: t("landing.contactForm.notifications.errorTitle"),
        description: t("landing.contactForm.notifications.errorDescription"),
=======
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
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
<<<<<<< HEAD
            {t("landing.contactForm.successTitle")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("landing.contactForm.successDescription")}
=======
            Thank you for reaching out!
          </h3>
          <p className="text-muted-foreground mb-6">
            We've received your message and will get back to you within 24 hours.
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          </p>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ fullName: "", email: "", phoneNumber: "", message: "" });
            }}
            variant="outline"
            className="transition-all duration-300 hover:shadow-soft"
          >
<<<<<<< HEAD
            {t("landing.contactForm.sendAnother")}
=======
            Send Another Message
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-elegant border-0 bg-gradient-subtle">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-foreground">
<<<<<<< HEAD
          {t("landing.contactForm.title")}
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          {t("landing.contactForm.subtitle")}
=======
          Get Started
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Tell us about your university goals and we'll help make them a reality.
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
<<<<<<< HEAD
              {t("landing.contactForm.labels.fullName")}
=======
              Full Name *
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card"
<<<<<<< HEAD
              placeholder={t("landing.contactForm.placeholders.fullName")}
=======
              placeholder="Enter your full name"
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
<<<<<<< HEAD
              {t("landing.contactForm.labels.email")}
=======
              Email Address *
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card"
<<<<<<< HEAD
              placeholder={t("landing.contactForm.placeholders.email")}
=======
              placeholder="Enter your email address"
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
<<<<<<< HEAD
              {t("landing.contactForm.labels.phone")}
=======
              Phone Number
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card"
<<<<<<< HEAD
              placeholder={t("landing.contactForm.placeholders.phone")}
=======
              placeholder="Enter your phone number"
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-foreground">
<<<<<<< HEAD
              {t("landing.contactForm.labels.message")}
=======
              Message or Questions
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="transition-all duration-300 focus:shadow-soft border-border/50 bg-card resize-none"
<<<<<<< HEAD
              placeholder={t("landing.contactForm.placeholders.message")}
=======
              placeholder="Tell us about your interests, goals, or any questions you have..."
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
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
<<<<<<< HEAD
                <span>{t("landing.contactForm.submitting")}</span>
=======
                <span>Sending...</span>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Send className="w-4 h-4" />
<<<<<<< HEAD
                <span>{t("landing.contactForm.submit")}</span>
=======
                <span>Send Message</span>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

<<<<<<< HEAD
export default ContactForm;
=======
export default ContactForm;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
